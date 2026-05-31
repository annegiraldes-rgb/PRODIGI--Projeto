import bcrypt


def password_valida(password_digitada, password_guardada):
    """Valida password bcrypt e também texto simples antigo, para migração."""
    if not password_guardada:
        return False
    password_guardada = str(password_guardada)
    if password_guardada.startswith(("$2a$", "$2b$", "$2y$")):
        try:
            return bcrypt.checkpw(password_digitada.encode("utf-8"), password_guardada.encode("utf-8"))
        except Exception:
            return False
    return password_digitada == password_guardada
