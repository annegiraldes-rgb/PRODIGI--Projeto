from flask import Blueprint, jsonify, request

from db import get_connection, query_all, query_one, execute

bp = Blueprint('internamentos', __name__)


@bp.route("/internamentos", methods=["GET"])
def get_internamentos():
    return query_all("""
        SELECT i.*, u.nome AS utente, h.nome AS hospital, p.nome AS medico_responsavel
        FROM internamentos i
        LEFT JOIN utentes u ON u.id = i.utente_id
        LEFT JOIN hospitais h ON h.id = i.hospital_id
        LEFT JOIN profissionais p ON p.id = i.medico_responsavel
        ORDER BY i.id
    """)


@bp.route("/internamentos", methods=["POST"])
def add_internamento():
    dados = request.get_json() or {}
    row = query_one("""
        INSERT INTO internamentos (episodio_urgencia_id, utente_id, hospital_id, medico_responsavel, servico, cama, data_hora_entrada, data_hora_alta, estado, diagnostico, observacoes)
        VALUES (%s, %s, %s, %s, %s, %s, COALESCE(%s, CURRENT_TIMESTAMP), %s, %s, %s, %s)
        RETURNING *
    """, (
        dados.get("episodio_urgencia_id"), dados.get("utente_id"), dados.get("hospital_id") or 1,
        dados.get("medico_responsavel") or dados.get("medico_responsavel_id"), dados.get("servico"), dados.get("cama"),
        dados.get("data_hora_entrada"), dados.get("data_hora_alta"), dados.get("estado") or "internado", dados.get("diagnostico"), dados.get("observacoes")
    ))
    execute("UPDATE episodios SET estado = 'internado' WHERE id = %s", (dados.get("episodio_urgencia_id"),))
    return jsonify({"mensagem": "Internamento criado com sucesso", **row})
