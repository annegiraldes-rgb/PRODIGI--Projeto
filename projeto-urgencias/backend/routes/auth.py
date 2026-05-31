from flask import Blueprint, jsonify, request

from db import get_connection, query_all, query_one, execute
from utils import password_valida
import psycopg2.extras

bp = Blueprint('auth', __name__)


@bp.route("/login", methods=["POST"])
def login():
    dados = request.get_json() or {}
    username = (dados.get("username") or "").strip()
    password = dados.get("password") or ""

    if not username or not password:
        return jsonify({"erro": "Preenche o utilizador e a palavra-passe."}), 400

    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT id, nome, username, password, perfil, hospital_id
        FROM utilizadores
        WHERE username = %s AND estado = 'ativo'
    """, (username,))
    user = cur.fetchone()
    cur.close()
    conn.close()

    if not user:
        return jsonify({"erro": "Utilizador ou palavra-passe inválidos."}), 401

    stored_hash = user["password"] or ""
    if not password_valida(password, stored_hash):
        return jsonify({"erro": "Utilizador ou palavra-passe inválidos."}), 401

    return jsonify({
        "id": user["id"],
        "nome": user["nome"],
        "username": user["username"],
        "perfil": user["perfil"],
        "hospital_id": user["hospital_id"],
        "token": "sessao-local"
    })
