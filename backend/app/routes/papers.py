"""Previous year papers routes"""
import os
import uuid
import json
import traceback
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from app import db
from app.models import PreviousYearPaper
from app.services.pdf_service import extract_text_from_pdf, chunk_text
from app.services.vector_service import add_document, delete_document

papers_bp = Blueprint('papers', __name__)


@papers_bp.route('/', methods=['GET'])
def list_papers():
    """List papers with optional subject/year filters."""
    subject = request.args.get('subject')
    year = request.args.get('year', type=int)
    exam_type = request.args.get('exam_type')

    query = PreviousYearPaper.query
    if subject:
        query = query.filter(PreviousYearPaper.subject.ilike(f'%{subject}%'))
    if year:
        query = query.filter_by(year=year)
    if exam_type:
        query = query.filter_by(exam_type=exam_type)

    papers = query.order_by(PreviousYearPaper.year.desc()).all()
    return jsonify([p.to_dict() for p in papers])


@papers_bp.route('/upload', methods=['POST'])
def upload_paper():
    """Upload a previous year question paper."""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        if not file.filename or not file.filename.lower().endswith('.pdf'):
            return jsonify({'error': 'Only PDF files are allowed'}), 400

        subject = request.form.get('subject', '').strip()
        year = request.form.get('year', type=int)
        exam_type = request.form.get('exam_type', 'semester')

        if not subject or not year:
            return jsonify({'error': 'Subject and year are required'}), 400

        original_name = file.filename
        unique_name = "{}.pdf".format(uuid.uuid4().hex)
        upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'papers')
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, unique_name)
        file.save(file_path)
        file_size = os.path.getsize(file_path)

        # Extract text (non-blocking on failure)
        text = ""
        try:
            text = extract_text_from_pdf(file_path)
        except Exception as e:
            print("PDF extraction warning:", str(e))

        paper = PreviousYearPaper(
            filename=unique_name,
            original_name=original_name,
            subject=subject,
            year=year,
            exam_type=exam_type,
            extracted_text=text,
            important_questions=json.dumps([]),
            file_path=file_path,
            file_size=file_size
        )
        db.session.add(paper)
        db.session.commit()

        # AI question extraction (non-blocking)
        if text:
            try:
                from app.services.ai_service import extract_important_questions
                questions = extract_important_questions(text)
                paper.important_questions = json.dumps(questions)
                db.session.commit()
            except Exception as e:
                print("AI extraction skipped:", str(e))

            # Vector indexing (non-blocking)
            try:
                chunks = chunk_text(text)
                add_document("paper_{}".format(paper.id), chunks, {'type': 'paper'})
            except Exception as e:
                print("Vector indexing skipped:", str(e))

        return jsonify({'message': 'Paper uploaded successfully', 'paper': paper.to_dict()}), 201

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@papers_bp.route('/<int:paper_id>', methods=['GET'])
def get_paper(paper_id):
    paper = PreviousYearPaper.query.get_or_404(paper_id)
    data = paper.to_dict()
    data['extracted_text'] = paper.extracted_text
    return jsonify(data)


@papers_bp.route('/subjects', methods=['GET'])
def get_subjects():
    """Return distinct subjects for filter dropdowns."""
    subjects = db.session.query(PreviousYearPaper.subject).distinct().all()
    years = db.session.query(PreviousYearPaper.year).distinct().order_by(PreviousYearPaper.year.desc()).all()
    return jsonify({
        'subjects': [s[0] for s in subjects],
        'years': [y[0] for y in years]
    })


@papers_bp.route('/analyze', methods=['POST'])
def analyze_trends():
    """Analyze multiple papers for trends and predictions."""
    from app.services.ai_service import analyze_papers_for_trends
    data = request.get_json()
    subject = data.get('subject')
    if not subject:
        return jsonify({'error': 'Subject is required'}), 400

    papers = PreviousYearPaper.query.filter(
        PreviousYearPaper.subject.ilike(f'%{subject}%'),
        PreviousYearPaper.extracted_text.isnot(None)
    ).all()

    if not papers:
        return jsonify({'error': 'No papers found for this subject'}), 404

    texts = [p.extracted_text for p in papers if p.extracted_text]
    try:
        analysis = analyze_papers_for_trends(texts, subject)
        return jsonify(analysis)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@papers_bp.route('/<int:paper_id>/download', methods=['GET'])
def download_paper(paper_id):
    paper = PreviousYearPaper.query.get_or_404(paper_id)
    directory = os.path.join(current_app.config['UPLOAD_FOLDER'], 'papers')
    return send_from_directory(directory, paper.filename, as_attachment=True, download_name=paper.original_name)


@papers_bp.route('/search', methods=['GET'])
def search_papers():
    """Search questions inside papers."""
    q = request.args.get('q', '')
    if not q:
        return jsonify([])
    papers = PreviousYearPaper.query.filter(
        PreviousYearPaper.extracted_text.ilike(f'%{q}%')
    ).all()
    return jsonify([p.to_dict() for p in papers])


@papers_bp.route('/<int:paper_id>', methods=['DELETE'])
def delete_paper(paper_id):
    paper = PreviousYearPaper.query.get_or_404(paper_id)
    try:
        if os.path.exists(paper.file_path):
            os.remove(paper.file_path)
        delete_document(f"paper_{paper.id}")
    except Exception:
        pass
    db.session.delete(paper)
    db.session.commit()
    return jsonify({'message': 'Paper deleted'})
