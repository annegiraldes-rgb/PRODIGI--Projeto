from flask import Flask
from flask_cors import CORS

from db import wait_for_db
from seed import init_db
from routes.health import bp as health_bp
from routes.auth import bp as auth_bp
from routes.hospitais import bp as hospitais_bp
from routes.profissionais import bp as profissionais_bp
from routes.utentes import bp as utentes_bp
from routes.episodios import bp as episodios_bp
from routes.triagens import bp as triagens_bp
from routes.consultas import bp as consultas_bp
from routes.atos import bp as atos_bp
from routes.prescricoes import bp as prescricoes_bp
from routes.internamentos import bp as internamentos_bp
from routes.relatorios import bp as relatorios_bp
from routes.tempo_espera import bp as tempo_espera_bp


def create_app():
    app = Flask(__name__)
    CORS(app)

    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(hospitais_bp)
    app.register_blueprint(profissionais_bp)
    app.register_blueprint(utentes_bp)
    app.register_blueprint(episodios_bp)
    app.register_blueprint(triagens_bp)
    app.register_blueprint(consultas_bp)
    app.register_blueprint(atos_bp)
    app.register_blueprint(prescricoes_bp)
    app.register_blueprint(internamentos_bp)
    app.register_blueprint(relatorios_bp)
    app.register_blueprint(tempo_espera_bp)
    return app


wait_for_db()
init_db()
app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
