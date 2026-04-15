"""Quiz generation and scoring routes"""
import json
from flask import Blueprint, request, jsonify
from app import db
from app.models import Quiz, Note, PreviousYearPaper
from app.services.ai_service import generate_quiz

quiz_bp = Blueprint('quiz', __name__)


@quiz_bp.route('/generate', methods=['POST'])
def generate():
    """Generate a quiz from a note or paper."""
    data = request.get_json()
    note_id = data.get('note_id')
    paper_id = data.get('paper_id')
    num_questions = min(int(data.get('num_questions', 5)), 10)

    text = None
    if note_id:
        note = Note.query.get_or_404(note_id)
        text = note.extracted_text
    elif paper_id:
        paper = PreviousYearPaper.query.get_or_404(paper_id)
        text = paper.extracted_text

    if not text:
        return jsonify({'error': 'No content available to generate quiz'}), 400

    try:
        questions = generate_quiz(text, num_questions)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    quiz = Quiz(
        note_id=note_id,
        paper_id=paper_id,
        questions=json.dumps(questions),
        total=len(questions)
    )
    db.session.add(quiz)
    db.session.commit()

    return jsonify({'quiz_id': quiz.id, 'questions': questions, 'total': len(questions)})


@quiz_bp.route('/<int:quiz_id>/submit', methods=['POST'])
def submit_quiz(quiz_id):
    """Submit answers and get score."""
    quiz = Quiz.query.get_or_404(quiz_id)
    data = request.get_json()
    answers = data.get('answers', {})  # {question_index: selected_option}

    questions = json.loads(quiz.questions)
    score = 0
    results = []

    for i, q in enumerate(questions):
        user_answer = answers.get(str(i), '')
        correct = q.get('correct', '')
        is_correct = user_answer.upper().startswith(correct.upper())
        if is_correct:
            score += 1
        results.append({
            'question': q['question'],
            'user_answer': user_answer,
            'correct_answer': correct,
            'is_correct': is_correct,
            'explanation': q.get('explanation', '')
        })

    quiz.score = score
    db.session.commit()

    return jsonify({
        'score': score,
        'total': len(questions),
        'percentage': round((score / len(questions)) * 100, 1) if questions else 0,
        'results': results
    })


@quiz_bp.route('/', methods=['GET'])
def list_quizzes():
    quizzes = Quiz.query.order_by(Quiz.created_at.desc()).limit(20).all()
    return jsonify([q.to_dict() for q in quizzes])


@quiz_bp.route('/<int:quiz_id>', methods=['GET'])
def get_quiz(quiz_id):
    quiz = Quiz.query.get_or_404(quiz_id)
    return jsonify(quiz.to_dict())
