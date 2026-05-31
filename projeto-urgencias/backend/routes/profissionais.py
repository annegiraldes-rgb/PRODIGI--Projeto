from flask import Blueprint, jsonify, request

from db import get_connection, query_all, query_one, execute

bp = Blueprint('profissionais', __name__)


@bp.route("/profissionais", methods=["GET"])
def get_profissionais():
    return query_all("""
        SELECT p.*, h.nome AS hospital
        FROM profissionais p
        LEFT JOIN hospitais h ON h.id = p.hospital_id
        ORDER BY p.id
    """)


@bp.route("/profissionais", methods=["POST"])
def add_profissional():
    dados = request.get_json() or {}
    row = query_one("""
        INSERT INTO profissionais (nome, tipo, especialidade, cedula, hospital_id)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING *
    """, (
        dados.get("nome"),
        dados.get("tipo"),
        dados.get("especialidade"),
        dados.get("cedula"),
        dados.get("hospital_id") or 1,
    ))
    return jsonify({"mensagem": "Profissional criado com sucesso", **row})
