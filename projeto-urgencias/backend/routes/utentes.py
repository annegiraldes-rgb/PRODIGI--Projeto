from flask import Blueprint, jsonify, request

from db import get_connection, query_all, query_one, execute

bp = Blueprint('utentes', __name__)


@bp.route("/utentes", methods=["GET"])
def get_utentes():
    return query_all("""
        SELECT *, nss AS n_sns
        FROM utentes
        ORDER BY id
    """)


@bp.route("/utentes", methods=["POST"])
def add_utente():
    dados = request.get_json() or {}
    row = query_one("""
        INSERT INTO utentes (nome, data_nascimento, nif, nss, sexo, telefone, morada, grupo_sanguineo, alergias, patologias)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (nif) DO UPDATE SET
            nome = EXCLUDED.nome,
            data_nascimento = EXCLUDED.data_nascimento,
            nss = EXCLUDED.nss,
            sexo = EXCLUDED.sexo,
            telefone = EXCLUDED.telefone,
            morada = EXCLUDED.morada,
            grupo_sanguineo = EXCLUDED.grupo_sanguineo,
            alergias = EXCLUDED.alergias,
            patologias = EXCLUDED.patologias
        RETURNING *, nss AS n_sns
    """, (
        dados.get("nome"),
        dados.get("data_nascimento"),
        dados.get("nif"),
        dados.get("nss") or dados.get("n_sns"),
        dados.get("sexo"),
        dados.get("telefone"),
        dados.get("morada"),
        dados.get("grupo_sanguineo"),
        dados.get("alergias"),
        dados.get("patologias"),
    ))
    return jsonify({"mensagem": "Utente criado com sucesso", **row})
