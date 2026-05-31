from flask import Blueprint, jsonify, request

from db import get_connection, query_all, query_one, execute

bp = Blueprint('episodios', __name__)


@bp.route("/episodios", methods=["GET"])
def get_episodios():
    return query_all("""
        SELECT e.*, u.nome AS utente, h.nome AS hospital
        FROM episodios e
        LEFT JOIN utentes u ON u.id = e.utente_id
        LEFT JOIN hospitais h ON h.id = e.hospital_id
        ORDER BY e.id
    """)


@bp.route("/episodios", methods=["POST"])
def add_episodio():
    dados = request.get_json() or {}
    row = query_one("""
        INSERT INTO episodios (utente_id, hospital_id, data_entrada, estado, tipo_entrada, motivo)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING *
    """, (
        dados.get("utente_id"),
        dados.get("hospital_id") or 1,
        dados.get("data_entrada"),
        dados.get("estado") or "aguardar_triagem",
        dados.get("tipo_entrada") or "normal",
        dados.get("motivo") or dados.get("motivo_entrada"),
    ))
    return jsonify({"mensagem": "Episódio criado com sucesso", **row})


@bp.route("/episodios/<int:episodio_id>/encerrar", methods=["PUT"])
def encerrar_episodio(episodio_id):
    dados = request.get_json() or {}
    execute("""
        UPDATE episodios
        SET data_hora_alta = COALESCE(%s, CURRENT_TIMESTAMP), estado = 'encerrado'
        WHERE id = %s
    """, (dados.get("data_hora_alta"), episodio_id))
    return jsonify({"mensagem": "Episódio encerrado com sucesso"})
