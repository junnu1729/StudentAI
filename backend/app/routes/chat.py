"""Chat / Q&A routes"""
import uuid
from flask import Blueprint, request, jsonify
from app import db
from app.models import ChatMessage, Note
from app.services.ai_service import answer_question
from app.services.vector_service import search_similar

chat_bp = Blueprint('chat', __name__)


@chat_bp.route('/ask', methods=['POST'])
def ask():
    """Ask a question based on uploaded notes."""
    data = request.get_json()
    question = data.get('question', '').strip()
    note_id = data.get('note_id')
    session_id = data.get('session_id') or str(uuid.uuid4())

    if not question:
        return jsonify({'error': 'Question is required'}), 400

    # Retrieve context from vector store or fallback to raw text
    doc_ids = [f"note_{note_id}"] if note_id else None
    context = search_similar(question, doc_ids=doc_ids)

    if not context and note_id:
        note = Note.query.get(note_id)
        if note and note.extracted_text:
            context = note.extracted_text[:4000]

    if not context:
        context = "No study material uploaded yet."

    # Fetch recent chat history for this session
    history = ChatMessage.query.filter_by(session_id=session_id).order_by(
        ChatMessage.created_at.asc()
    ).limit(10).all()
    history_dicts = [m.to_dict() for m in history]

    try:
        answer = answer_question(question, context, history_dicts)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    # Persist messages
    user_msg = ChatMessage(session_id=session_id, note_id=note_id, role='user', content=question)
    ai_msg = ChatMessage(session_id=session_id, note_id=note_id, role='assistant', content=answer)
    db.session.add_all([user_msg, ai_msg])
    db.session.commit()

    return jsonify({
        'answer': answer,
        'session_id': session_id,
        'message_id': ai_msg.id
    })


@chat_bp.route('/history/<session_id>', methods=['GET'])
def get_history(session_id):
    """Fetch chat history for a session."""
    messages = ChatMessage.query.filter_by(session_id=session_id).order_by(
        ChatMessage.created_at.asc()
    ).all()
    return jsonify([m.to_dict() for m in messages])


@chat_bp.route('/sessions', methods=['GET'])
def list_sessions():
    """List unique chat sessions."""
    sessions = db.session.query(
        ChatMessage.session_id,
        db.func.min(ChatMessage.created_at).label('started_at'),
        db.func.count(ChatMessage.id).label('message_count')
    ).group_by(ChatMessage.session_id).order_by(db.desc('started_at')).all()

    return jsonify([{
        'session_id': s.session_id,
        'started_at': s.started_at.isoformat(),
        'message_count': s.message_count
    } for s in sessions])


@chat_bp.route('/session/<session_id>', methods=['DELETE'])
def delete_session(session_id):
    ChatMessage.query.filter_by(session_id=session_id).delete()
    db.session.commit()
    return jsonify({'message': 'Session deleted'})
