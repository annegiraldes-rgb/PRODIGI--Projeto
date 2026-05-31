from flask import Blueprint, jsonify, request

from db import get_connection, query_all, query_one, execute

bp = Blueprint('hospitais', __name__)


@bp.route("/hospitais", methods=["GET"])
def get_hospitais():
    return query_all("SELECT * FROM hospitais ORDER BY id")


@bp.route("/hospitais", methods=["POST"])
def add_hospital():
    dados = request.get_json() or {}
    row = query_one("""
        INSERT INTO hospitais (nome, localizacao)
        VALUES (%s, %s)
        RETURNING *
    """, (dados.get("nome"), dados.get("localizacao")))
    return jsonify({"mensagem": "Hospital criado com sucesso", **row})
