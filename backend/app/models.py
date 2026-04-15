from app import db
from datetime import datetime


class Note(db.Model):
    """Uploaded study notes/PDFs"""
    __tablename__ = 'notes'

    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    original_name = db.Column(db.String(255), nullable=False)
    subject = db.Column(db.String(100))
    extracted_text = db.Column(db.Text)
    summary = db.Column(db.Text)
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    chats = db.relationship('ChatMessage', backref='note', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'original_name': self.original_name,
            'subject': self.subject,
            'summary': self.summary,
            'file_size': self.file_size,
            'has_text': bool(self.extracted_text),
            'created_at': self.created_at.isoformat()
        }


class PreviousYearPaper(db.Model):
    """Previous year exam question papers"""
    __tablename__ = 'previous_year_papers'

    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    original_name = db.Column(db.String(255), nullable=False)
    subject = db.Column(db.String(100), nullable=False)
    year = db.Column(db.Integer, nullable=False)
    exam_type = db.Column(db.String(50))  # mid, semester, final, etc.
    extracted_text = db.Column(db.Text)
    important_questions = db.Column(db.Text)  # JSON string
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        import json
        return {
            'id': self.id,
            'filename': self.filename,
            'original_name': self.original_name,
            'subject': self.subject,
            'year': self.year,
            'exam_type': self.exam_type,
            'important_questions': json.loads(self.important_questions) if self.important_questions else [],
            'file_size': self.file_size,
            'has_text': bool(self.extracted_text),
            'created_at': self.created_at.isoformat()
        }


class ChatMessage(db.Model):
    """Chat history for Q&A sessions"""
    __tablename__ = 'chat_messages'

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(100), nullable=False)
    note_id = db.Column(db.Integer, db.ForeignKey('notes.id'), nullable=True)
    role = db.Column(db.String(20), nullable=False)  # user / assistant
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'note_id': self.note_id,
            'role': self.role,
            'content': self.content,
            'created_at': self.created_at.isoformat()
        }


class Quiz(db.Model):
    """Generated quizzes"""
    __tablename__ = 'quizzes'

    id = db.Column(db.Integer, primary_key=True)
    note_id = db.Column(db.Integer, db.ForeignKey('notes.id'), nullable=True)
    paper_id = db.Column(db.Integer, db.ForeignKey('previous_year_papers.id'), nullable=True)
    questions = db.Column(db.Text, nullable=False)  # JSON string
    score = db.Column(db.Integer, nullable=True)
    total = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        import json
        return {
            'id': self.id,
            'note_id': self.note_id,
            'paper_id': self.paper_id,
            'questions': json.loads(self.questions),
            'score': self.score,
            'total': self.total,
            'created_at': self.created_at.isoformat()
        }
