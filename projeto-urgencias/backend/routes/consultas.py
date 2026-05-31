from flask import Blueprint, jsonify, request

from db import get_connection, query_all, query_one, execute

bp = Blueprint('consultas', __name__)


@bp.route("/consultas", methods=["GET"])
def get_consultas():
    return query_all("""
        SELECT c.*, u.nome AS utente, p.nome AS profissional
        FROM consultas c
        LEFT JOIN episodios e ON e.id = c.episodio_urgencia_id
        LEFT JOIN utentes u ON u.id = e.utente_id
        LEFT JOIN profissionais p ON p.id = c.profissional_id
        ORDER BY c.id
    """)


@bp.route("/consultas", methods=["POST"])
def add_consulta():
    dados = request.get_json() or {}
    row = query_one("""
        INSERT INTO consultas (episodio_urgencia_id, profissional_id, tipo, data_hora, queixa, historia, exame, sinais, observacoes, diagnostico, plano)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING *
    """, (
        dados.get("episodio_urgencia_id"), dados.get("profissional_id"), dados.get("tipo"), dados.get("data_hora") or dados.get("data"),
        dados.get("queixa"), dados.get("historia"), dados.get("exame"), dados.get("sinais"), dados.get("observacoes") or dados.get("obs"), dados.get("diagnostico"), dados.get("plano")
    ))
    execute("UPDATE episodios SET estado = 'em_consulta' WHERE id = %s", (dados.get("episodio_urgencia_id"),))
    return jsonify({"mensagem": "Consulta criada com sucesso", **row})
