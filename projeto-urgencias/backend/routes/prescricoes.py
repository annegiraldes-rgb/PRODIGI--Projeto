from flask import Blueprint, jsonify, request

from db import get_connection, query_all, query_one, execute

bp = Blueprint('prescricoes', __name__)


@bp.route("/prescricoes", methods=["GET"])
def get_prescricoes():
    return query_all("""
        SELECT pr.*, u.nome AS utente, COALESCE(c.tipo, 'Consulta') AS ato, p.nome AS profissional
        FROM prescricoes pr
        LEFT JOIN episodios e ON e.id = pr.episodio_urgencia_id
        LEFT JOIN utentes u ON u.id = e.utente_id
        LEFT JOIN consultas c ON c.id = pr.consulta_id
        LEFT JOIN profissionais p ON p.id = pr.profissional_id
        ORDER BY pr.id
    """)


@bp.route("/prescricoes", methods=["POST"])
def add_prescricao():
    dados = request.get_json() or {}
    row = query_one("""
        INSERT INTO prescricoes (episodio_urgencia_id, consulta_id, profissional_id, descricao, dose, frequencia, via, estado, observacoes)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING *
    """, (
        dados.get("episodio_urgencia_id"), dados.get("consulta_id"), dados.get("profissional_id"), dados.get("descricao"),
        dados.get("dose"), dados.get("frequencia"), dados.get("via"), dados.get("estado") or "pendente", dados.get("observacoes")
    ))
    return jsonify({"mensagem": "Prescrição criada com sucesso", **row})
