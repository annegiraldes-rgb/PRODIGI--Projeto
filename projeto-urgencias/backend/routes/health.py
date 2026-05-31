from flask import Blueprint, jsonify, request

from db import get_connection, query_all, query_one, execute

bp = Blueprint('health', __name__)


@bp.route("/health")
def health():
    return jsonify({"status": "ok", "mensagem": "Backend a funcionar"})
