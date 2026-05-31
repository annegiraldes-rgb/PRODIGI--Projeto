from flask import Blueprint, jsonify, request

from db import get_connection, query_all, query_one, execute

bp = Blueprint('triagens', __name__)


@bp.route("/triagens", methods=["GET"])
def get_triagens():
    return query_all("""
        SELECT t.*, u.nome AS utente, p.nome AS profissional, e.estado AS estado_episodio
        FROM triagens t
        LEFT JOIN episodios e ON e.id = t.episodio_urgencia_id
        LEFT JOIN utentes u ON u.id = e.utente_id
        LEFT JOIN profissionais p ON p.id = t.profissional_id
        ORDER BY t.id
    """)


@bp.route("/triagens", methods=["POST"])
def add_triagem():
    dados = request.get_json() or {}
    row = query_one("""
        INSERT INTO triagens (episodio_urgencia_id, profissional_id, data_hora, prioridade, motivo_admissao, sintomas, observacoes)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING *
    """, (
        dados.get("episodio_urgencia_id"),
        dados.get("profissional_id") or None,
        dados.get("data_hora"),
        dados.get("prioridade"),
        dados.get("motivo_admissao"),
        dados.get("sintomas"),
        dados.get("observacoes"),
    ))
    execute("UPDATE episodios SET estado = %s WHERE id = %s", (dados.get("estado_episodio") or "aguardar_consulta", dados.get("episodio_urgencia_id")))
    return jsonify({"mensagem": "Triagem criada com sucesso", **row})
