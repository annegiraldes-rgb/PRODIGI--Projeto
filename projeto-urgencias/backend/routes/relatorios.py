from flask import Blueprint, jsonify, request

from db import get_connection, query_all, query_one, execute
import psycopg2.extras

bp = Blueprint('relatorios', __name__)


@bp.route("/utentes_anonimizados", methods=["GET"])
def get_utentes_anonimizados():
    """Dados de utentes para análise sem identificadores diretos.
    Remove nome, NIF, Nº SNS, telefone e morada; expõe apenas um código pseudónimo.
    """
    return query_all("""
        SELECT
            md5('utente-' || id::text) AS codigo_utente,
            CAST(EXTRACT(YEAR FROM AGE(CURRENT_DATE, data_nascimento)) AS INT) AS idade,
            CASE
                WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, data_nascimento)) < 18 THEN '0-17'
                WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, data_nascimento)) BETWEEN 18 AND 35 THEN '18-35'
                WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, data_nascimento)) BETWEEN 36 AND 64 THEN '36-64'
                ELSE '65+'
            END AS faixa_etaria,
            COALESCE(sexo, 'não indicado') AS sexo,
            COALESCE(grupo_sanguineo, 'não indicado') AS grupo_sanguineo,
            DATE(data_registo) AS data_registo
        FROM utentes
        ORDER BY id
    """)


@bp.route("/episodios_anonimizados", methods=["GET"])
def get_episodios_anonimizados():
    """Episódios para relatórios/estatística com utente pseudonimizado."""
    return query_all("""
        SELECT
            md5('episodio-' || e.id::text) AS codigo_episodio,
            md5('utente-' || e.utente_id::text) AS codigo_utente,
            e.estado,
            COALESCE(e.tipo_entrada, 'normal') AS tipo_entrada,
            DATE(e.data_entrada) AS data_entrada,
            DATE_TRUNC('hour', e.data_entrada) AS hora_entrada,
            h.nome AS hospital,
            COALESCE(t.prioridade, 'Sem triagem') AS prioridade
        FROM episodios e
        LEFT JOIN hospitais h ON h.id = e.hospital_id
        LEFT JOIN LATERAL (
            SELECT prioridade
            FROM triagens t
            WHERE t.episodio_urgencia_id = e.id
            ORDER BY t.data_hora DESC
            LIMIT 1
        ) t ON TRUE
        ORDER BY e.data_entrada DESC
    """)


@bp.route("/analitica_anonimizada", methods=["GET"])
def get_analitica_anonimizada():
    """Resumo agregado para relatórios sem expor dados pessoais diretos."""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cur.execute("""
        SELECT COUNT(*) AS total_utentes
        FROM utentes
    """)
    total_utentes = int(cur.fetchone()["total_utentes"])

    cur.execute("""
        SELECT COUNT(*) AS total_episodios
        FROM episodios
    """)
    total_episodios = int(cur.fetchone()["total_episodios"])

    cur.execute("""
        SELECT COUNT(*) AS total_consultas
        FROM consultas
    """)
    total_consultas = int(cur.fetchone()["total_consultas"])

    cur.execute("""
        SELECT COUNT(*) AS total_exames
        FROM atos
        WHERE COALESCE(tipo, '') <> 'consulta'
    """)
    total_exames = int(cur.fetchone()["total_exames"])

    cur.execute("""
        SELECT COUNT(*) AS total_prescricoes
        FROM prescricoes
    """)
    total_prescricoes = int(cur.fetchone()["total_prescricoes"])

    cur.execute("""
        SELECT COUNT(*) AS total_internamentos
        FROM internamentos
    """)
    total_internamentos = int(cur.fetchone()["total_internamentos"])

    cur.execute("""
        SELECT
            DATE(e.data_entrada) AS data,
            COUNT(DISTINCT e.utente_id) AS utentes,
            COUNT(*) AS episodios,
            COUNT(DISTINCT c.id) AS consultas,
            COUNT(DISTINCT a.id) FILTER (WHERE COALESCE(a.tipo, '') <> 'consulta') AS exames
        FROM episodios e
        LEFT JOIN consultas c ON c.episodio_urgencia_id = e.id
        LEFT JOIN atos a ON a.episodio_urgencia_id = e.id
        GROUP BY DATE(e.data_entrada)
        ORDER BY data DESC
        LIMIT 7
    """)
    por_dia = cur.fetchall()

    cur.execute("""
        SELECT
            CASE
                WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, data_nascimento)) < 18 THEN '0-17'
                WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, data_nascimento)) BETWEEN 18 AND 35 THEN '18-35'
                WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, data_nascimento)) BETWEEN 36 AND 64 THEN '36-64'
                ELSE '65+'
            END AS faixa_etaria,
            COUNT(*) AS total
        FROM utentes
        GROUP BY faixa_etaria
        ORDER BY faixa_etaria
    """)
    por_faixa_etaria = cur.fetchall()

    cur.execute("""
        SELECT COALESCE(prioridade, 'Sem triagem') AS prioridade, COUNT(*) AS total
        FROM triagens
        GROUP BY prioridade
        ORDER BY total DESC
    """)
    por_prioridade = cur.fetchall()

    cur.close()
    conn.close()

    return jsonify({
        "totais": {
            "utentes": total_utentes,
            "episodios": total_episodios,
            "consultas": total_consultas,
            "exames": total_exames,
            "prescricoes": total_prescricoes,
            "internamentos": total_internamentos,
        },
        "por_dia": por_dia,
        "por_faixa_etaria": por_faixa_etaria,
        "por_prioridade": por_prioridade,
        "privacidade": {
            "metodo": "pseudonimizacao",
            "campos_removidos": ["nome", "nif", "nss", "telefone", "morada"],
            "finalidade": "relatorios, estatistica e eventual treino de modelos sem identificadores diretos"
        }
    })



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


@bp.route("/relatorios", methods=["GET"])
def get_relatorios():
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    counts = {}
    for key, sql in {
        "utentes": "SELECT COUNT(*) AS total FROM utentes",
        "episodios": "SELECT COUNT(*) AS total FROM episodios",
        "consultas": "SELECT COUNT(*) AS total FROM consultas",
        "exames": "SELECT COUNT(*) AS total FROM atos WHERE COALESCE(tipo, '') <> 'consulta'",
        "prescricoes": "SELECT COUNT(*) AS total FROM prescricoes",
        "internamentos": "SELECT COUNT(*) AS total FROM internamentos",
    }.items():
        cur.execute(sql)
        counts[key] = int(cur.fetchone()["total"])
    cur.close()
    conn.close()
    return jsonify(counts)
