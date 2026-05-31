import bcrypt

from db import get_connection


def init_db():
    conn = get_connection()
    cur = conn.cursor()



    cur.execute("""
        INSERT INTO hospitais (id, nome, localizacao)
        VALUES (1, 'Hospital Central', 'Lisboa')
        ON CONFLICT (id) DO NOTHING;
    """)


    cur.execute("""
        INSERT INTO profissionais (id, nome, tipo, especialidade, cedula, hospital_id)
        VALUES
            (1, 'Dr. João Silva', 'medico', 'Medicina Interna', 'MED123', 1),
            (2, 'Enf. Maria Santos', 'enfermeiro', 'Urgência / Triagem', 'ENF456', 1)
        ON CONFLICT (id) DO NOTHING;
    """)

    password_hash = bcrypt.hashpw("1234".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    seed_users = [
        ("Admin Hospital", "admin", "admin", 1),
        ("Receção Administrativa", "administrativo", "administrativo", 1),
        ("Dr. João Silva", "medico", "medico", 1),
        ("Enf. Maria Santos", "enfermeiro", "enfermeiro", 1),
    ]
    for nome, username, perfil, hospital_id in seed_users:
        cur.execute("""
            INSERT INTO utilizadores (nome, username, password, perfil, hospital_id, estado)
            VALUES (%s, %s, %s, %s, %s, 'ativo')
            ON CONFLICT (username) DO UPDATE SET
                password = EXCLUDED.password,
                perfil = EXCLUDED.perfil,
                hospital_id = EXCLUDED.hospital_id,
                estado = 'ativo';
        """, (nome, username, password_hash, perfil, hospital_id))

    cur.execute("""
        INSERT INTO utentes (id, nome, data_nascimento, nif, nss, sexo, grupo_sanguineo)
        VALUES (1, 'Ana Silva', '1985-04-12', '123456789', '12345678901', 'feminino', 'A+')
        ON CONFLICT (id) DO NOTHING;
    """)

    cur.execute("""
        INSERT INTO episodios (id, utente_id, hospital_id, data_entrada, estado, tipo_entrada, motivo)
        VALUES (1, 1, 1, CURRENT_TIMESTAMP, 'aguardar_triagem', 'normal', 'Dor abdominal')
        ON CONFLICT (id) DO NOTHING;
    """)

    cur.execute("SELECT setval('hospitais_id_seq', COALESCE((SELECT MAX(id) FROM hospitais), 1));")
    cur.execute("SELECT setval('profissionais_id_seq', COALESCE((SELECT MAX(id) FROM profissionais), 1));")
    cur.execute("SELECT setval('utilizadores_id_seq', COALESCE((SELECT MAX(id) FROM utilizadores), 1));")
    cur.execute("SELECT setval('utentes_id_seq', COALESCE((SELECT MAX(id) FROM utentes), 1));")
    cur.execute("SELECT setval('episodios_id_seq', COALESCE((SELECT MAX(id) FROM episodios), 1));")

    conn.commit()
    cur.close()
    conn.close()
