from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
import os

load_dotenv()

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)

    # Config
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    # Fix postgres:// -> postgresql:// for SQLAlchemy compatibility
    db_url = os.getenv('DATABASE_URL', 'sqlite:///study_assistant.db')
    if db_url.startswith('postgres://'):
        db_url = db_url.replace('postgres://', 'postgresql://', 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER', 'uploads')
    app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_CONTENT_LENGTH', str(16 * 1024 * 1024)))

    # Ensure upload directories exist
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'notes'), exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'papers'), exist_ok=True)

    # Init extensions
    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*", "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"], "allow_headers": ["Content-Type", "Authorization"]}})

    # Register blueprints
    from app.routes.notes import notes_bp
    from app.routes.papers import papers_bp
    from app.routes.chat import chat_bp
    from app.routes.quiz import quiz_bp

    app.register_blueprint(notes_bp, url_prefix='/api/notes')
    app.register_blueprint(papers_bp, url_prefix='/api/papers')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    app.register_blueprint(quiz_bp, url_prefix='/api/quiz')

    with app.app_context():
        db.create_all()

    return app
