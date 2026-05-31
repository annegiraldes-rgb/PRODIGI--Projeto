import os
import time
import psycopg2
import psycopg2.extras
from flask import jsonify


def get_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        database=os.getenv("DB_NAME", "hospital_urgencias"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "postgres"),
        port=os.getenv("DB_PORT", "5432"),
    )


def wait_for_db(max_tries=60):
    for _ in range(max_tries):
        try:
            conn = get_connection()
            conn.close()
            return
        except Exception:
            time.sleep(1)
    raise RuntimeError("Não foi possível ligar à base de dados.")


def query_all(sql, params=None):
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(sql, params or ())
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(rows)


def query_one(sql, params=None):
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(sql, params or ())
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return row


def execute(sql, params=None):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(sql, params or ())
    conn.commit()
    cur.close()
    conn.close()
