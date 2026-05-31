from flask import Blueprint, jsonify, request
import time
import psycopg2.extras

from db import get_connection


bp = Blueprint('tempo_espera', __name__)


PRIORIDADES_BASE_MINUTOS = {
    "vermelho": 5,
    "laranja": 15,
    "amarelo": 45,
    "verde": 95,
    "azul": 130,
    "sem triagem": 70,
}


def normalizar_prioridade(valor):
    v = (valor or "sem triagem").strip().lower()
    if "vermel" in v:
        return "vermelho"
    if "laranja" in v:
        return "laranja"
    if "amarel" in v:
        return "amarelo"
    if "verde" in v:
        return "verde"
    if "azul" in v:
        return "azul"
    return "sem triagem"


def formatar_minutos(minutos):
    try:
        minutos = max(0, int(round(float(minutos))))
    except Exception:
        minutos = 0
    return f"{minutos // 60:02d}h {minutos % 60:02d}m"


def prever_tempo_espera_minutos(prioridade, idade=45, hora=None, em_espera=0, profissionais_disponiveis=1, media_recente=None):
    """Modelo preditivo simples e explicável.
    Usa dados históricos/recentes da base PostgreSQL quando existem; caso contrário aplica valores clínicos-base por prioridade.
    Não substitui validação operacional; serve como apoio à gestão da urgência.
    """
    prioridade_norm = normalizar_prioridade(prioridade)
    base = float(media_recente or PRIORIDADES_BASE_MINUTOS.get(prioridade_norm, 70))
    try:
        idade = int(idade or 45)
    except Exception:
        idade = 45
    try:
        hora = int(hora if hora is not None else time.localtime().tm_hour)
    except Exception:
        hora = time.localtime().tm_hour
    try:
        em_espera = max(0, int(em_espera or 0))
    except Exception:
        em_espera = 0
    try:
        profissionais_disponiveis = max(1, int(profissionais_disponiveis or 1))
    except Exception:
        profissionais_disponiveis = 1

    fator_idade = 0.90 if idade >= 75 and prioridade_norm in ("vermelho", "laranja", "amarelo") else 1.0
    fator_hora = 1.25 if 10 <= hora <= 22 else 0.90
    fator_carga = 1 + min(em_espera / (profissionais_disponiveis * 14), 1.4)
    fator_prioridade = {
        "vermelho": 0.35,
        "laranja": 0.55,
        "amarelo": 0.85,
        "verde": 1.15,
        "azul": 1.30,
        "sem triagem": 1.0,
    }.get(prioridade_norm, 1.0)
    previsao = base * fator_idade * fator_hora * fator_carga * fator_prioridade
    return max(1, min(int(round(previsao)), 480))


@bp.route("/tempo_espera/previsao", methods=["GET"])
def get_previsao_tempo_espera():
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cur.execute("""
        WITH base AS (
            SELECT
                e.id,
                e.data_entrada,
                e.estado,
                COALESCE(t.prioridade, 'Sem triagem') AS prioridade,
                t.data_hora AS data_triagem,
                c.data_hora AS data_consulta,
                EXTRACT(EPOCH FROM (COALESCE(c.data_hora, t.data_hora, e.data_hora_alta, CURRENT_TIMESTAMP) - e.data_entrada))/60.0 AS espera_geral_min,
                EXTRACT(EPOCH FROM (t.data_hora - e.data_entrada))/60.0 AS espera_triagem_min,
                EXTRACT(EPOCH FROM (c.data_hora - COALESCE(t.data_hora, e.data_entrada)))/60.0 AS espera_consulta_min
            FROM episodios e
            LEFT JOIN LATERAL (
                SELECT prioridade, data_hora
                FROM triagens t
                WHERE t.episodio_urgencia_id = e.id
                ORDER BY t.data_hora ASC
                LIMIT 1
            ) t ON TRUE
            LEFT JOIN LATERAL (
                SELECT data_hora
                FROM consultas c
                WHERE c.episodio_urgencia_id = e.id
                ORDER BY c.data_hora ASC
                LIMIT 1
            ) c ON TRUE
            WHERE e.data_entrada >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
        )
        SELECT
            COUNT(*) AS entradas_24h,
            COUNT(*) FILTER (WHERE estado NOT IN ('encerrado','internado')) AS em_espera,
            COALESCE(AVG(espera_geral_min), 0) AS media_geral_min,
            COALESCE(AVG(espera_triagem_min) FILTER (WHERE espera_triagem_min IS NOT NULL), 0) AS media_triagem_min,
            COALESCE(AVG(espera_consulta_min) FILTER (WHERE espera_consulta_min IS NOT NULL), 0) AS media_consulta_min,
            COALESCE(MAX(espera_geral_min), 0) AS max_espera_min
        FROM base
    """)
    resumo = cur.fetchone()

    cur.execute("""
        SELECT
            COALESCE(t.prioridade, 'Sem triagem') AS prioridade,
            COUNT(*) AS total,
            COALESCE(AVG(EXTRACT(EPOCH FROM (COALESCE(c.data_hora, e.data_hora_alta, CURRENT_TIMESTAMP) - e.data_entrada))/60.0), 0) AS media_min
        FROM episodios e
        LEFT JOIN LATERAL (
            SELECT prioridade, data_hora FROM triagens t WHERE t.episodio_urgencia_id = e.id ORDER BY t.data_hora ASC LIMIT 1
        ) t ON TRUE
        LEFT JOIN LATERAL (
            SELECT data_hora FROM consultas c WHERE c.episodio_urgencia_id = e.id ORDER BY c.data_hora ASC LIMIT 1
        ) c ON TRUE
        WHERE e.data_entrada >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
        GROUP BY COALESCE(t.prioridade, 'Sem triagem')
    """)
    por_prioridade_rows = cur.fetchall()

    medias = {normalizar_prioridade(r["prioridade"]): float(r["media_min"] or 0) for r in por_prioridade_rows}
    por_prioridade = []
    for nome in ["vermelho", "laranja", "amarelo", "verde", "azul", "sem triagem"]:
        media = medias.get(nome) or PRIORIDADES_BASE_MINUTOS[nome]
        por_prioridade.append({"prioridade": nome.title(), "media_min": int(round(media)), "media_formatada": formatar_minutos(media)})

    cur.execute("""
        SELECT
            to_char(date_trunc('hour', e.data_entrada), 'HH24:00') AS periodo,
            COUNT(DISTINCT e.id) AS entradas,
            COUNT(DISTINCT c.id) AS consultas,
            COALESCE(AVG(EXTRACT(EPOCH FROM (COALESCE(c.data_hora, e.data_hora_alta, CURRENT_TIMESTAMP) - e.data_entrada))/60.0), 0) AS media_min
        FROM episodios e
        LEFT JOIN consultas c ON c.episodio_urgencia_id = e.id
        WHERE e.data_entrada >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
        GROUP BY date_trunc('hour', e.data_entrada)
        ORDER BY date_trunc('hour', e.data_entrada) DESC
        LIMIT 8
    """)
    periodos = [{**dict(r), "media_formatada": formatar_minutos(r["media_min"])} for r in cur.fetchall()]

    cur.execute("SELECT COUNT(*) AS total FROM profissionais WHERE estado = 'ativo'")
    profissionais = int(cur.fetchone()["total"] or 1)
    cur.close()
    conn.close()

    em_espera = int(resumo["em_espera"] or 0)
    previsoes = []
    for nome in ["vermelho", "laranja", "amarelo", "verde", "azul"]:
        mins = prever_tempo_espera_minutos(nome, em_espera=em_espera, profissionais_disponiveis=profissionais, media_recente=medias.get(nome))
        previsoes.append({"prioridade": nome.title(), "minutos": mins, "tempo": formatar_minutos(mins)})

    return jsonify({
        "resumo": {
            "entradas_24h": int(resumo["entradas_24h"] or 0),
            "em_espera": em_espera,
            "media_geral_min": int(round(float(resumo["media_geral_min"] or 0))),
            "media_geral": formatar_minutos(resumo["media_geral_min"]),
            "media_triagem": formatar_minutos(resumo["media_triagem_min"]),
            "media_consulta": formatar_minutos(resumo["media_consulta_min"]),
            "max_espera": formatar_minutos(resumo["max_espera_min"]),
            "profissionais_ativos": profissionais,
        },
        "por_prioridade": por_prioridade,
        "periodos": periodos,
        "previsoes": previsoes,
        "modelo": "heuristico-com-dados-postgresql",
    })


@bp.route("/tempo_espera/prever", methods=["POST"])
def post_prever_tempo_espera():
    dados = request.get_json() or {}
    prioridade = normalizar_prioridade(dados.get("prioridade"))
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (COALESCE(c.data_hora, e.data_hora_alta, CURRENT_TIMESTAMP) - e.data_entrada))/60.0), 0) AS media_min
        FROM episodios e
        LEFT JOIN LATERAL (
            SELECT prioridade FROM triagens t WHERE t.episodio_urgencia_id = e.id ORDER BY t.data_hora ASC LIMIT 1
        ) t ON TRUE
        LEFT JOIN LATERAL (
            SELECT data_hora FROM consultas c WHERE c.episodio_urgencia_id = e.id ORDER BY c.data_hora ASC LIMIT 1
        ) c ON TRUE
        WHERE e.data_entrada >= CURRENT_TIMESTAMP - INTERVAL '30 days'
          AND lower(COALESCE(t.prioridade, 'sem triagem')) LIKE %s
    """, (f"%{prioridade.split()[0]}%",))
    media = float(cur.fetchone()["media_min"] or 0) or None
    cur.close()
    conn.close()
    minutos = prever_tempo_espera_minutos(
        prioridade,
        idade=dados.get("idade"),
        hora=dados.get("hora"),
        em_espera=dados.get("em_espera"),
        profissionais_disponiveis=dados.get("profissionais_disponiveis"),
        media_recente=media,
    )
    return jsonify({
        "prioridade": prioridade.title(),
        "minutos": minutos,
        "tempo": formatar_minutos(minutos),
        "media_historica_usada": formatar_minutos(media or PRIORIDADES_BASE_MINUTOS.get(prioridade, 70)),
        "explicacao": "Previsão calculada por prioridade, hora do dia, idade, carga atual e profissionais disponíveis, usando médias da base PostgreSQL quando existem."
    })
