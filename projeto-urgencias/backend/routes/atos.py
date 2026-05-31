from flask import Blueprint, jsonify, request

from db import get_connection, query_all, query_one, execute

bp = Blueprint('atos', __name__)


@bp.route("/atos", methods=["GET"])
def get_atos():
    return query_all("""
        SELECT a.*, u.nome AS utente, p.nome AS profissionais
        FROM atos a
        LEFT JOIN episodios e ON e.id = a.episodio_urgencia_id
        LEFT JOIN utentes u ON u.id = e.utente_id
        LEFT JOIN profissionais p ON p.id = a.profissional_id
        ORDER BY a.id
    """)


@bp.route("/atos", methods=["POST"])
def add_ato():
    dados = request.get_json() or {}
    episodio_id = dados.get("episodio_urgencia_id") or dados.get("episodio_id")
    row = query_one("""
        INSERT INTO atos (episodio_urgencia_id, consulta_id, profissional_id, tipo, descricao, data, estado)
        VALUES (%s, %s, %s, %s, %s, COALESCE(%s, CURRENT_TIMESTAMP), %s)
        RETURNING *
    """, (
        episodio_id, dados.get("consulta_id"), dados.get("profissional_id") or dados.get("funcionario_id"), dados.get("tipo"),
        dados.get("descricao") or dados.get("tipo"), dados.get("data"), dados.get("estado") or "pendente"
    ))
    return jsonify({"mensagem": "Ato clínico criado com sucesso", **row})
