"""Notes upload and management routes"""
import os
import uuid
import traceback
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from app import db
from app.models import Note
from app.services.pdf_service import extract_text_from_pdf, chunk_text
from app.services.vector_service import add_document, delete_document

notes_bp = Blueprint('notes', __name__)

ALLOWED_EXTENSIONS = {'pdf', 'txt'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@notes_bp.route('/', methods=['GET'])
def list_notes():
    """List all uploaded notes."""
    try:
        notes = Note.query.order_by(Note.created_at.desc()).all()
        return jsonify([n.to_dict() for n in notes])
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@notes_bp.route('/upload', methods=['POST'])
def upload_note():
    """Upload a PDF or text note."""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        if not file.filename or not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Only PDF and TXT allowed.'}), 400

        subject = request.form.get('subject', 'General')
        original_name = file.filename
        ext = original_name.rsplit('.', 1)[1].lower()
        unique_name = "{}.{}".format(uuid.uuid4().hex, ext)

        upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'notes')
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, unique_name)
        file.save(file_path)
        file_size = os.path.getsize(file_path)

        text = ""
        try:
            if ext == 'pdf':
                text = extract_text_from_pdf(file_path)
            else:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    text = f.read()
        except Exception as e:
            print("Text extraction warning:", str(e))

        note = Note(
            filename=unique_name,
            original_name=original_name,
            subject=subject,
            extracted_text=text,
            file_path=file_path,
            file_size=file_size
        )
        db.session.add(note)
        db.session.commit()

        if text:
            try:
                chunks = chunk_text(text)
                add_document("note_{}".format(note.id), chunks, {'type': 'note', 'subject': subject})
            except Exception as e:
                print("Vector indexing skipped:", str(e))

        return jsonify({'message': 'Note uploaded successfully', 'note': note.to_dict()}), 201

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@notes_bp.route('/<int:note_id>', methods=['GET'])
def get_note(note_id):
    note = Note.query.get_or_404(note_id)
    data = note.to_dict()
    data['extracted_text'] = note.extracted_text
    return jsonify(data)


@notes_bp.route('/<int:note_id>/summarize', methods=['POST'])
def summarize_note(note_id):
    """Generate or return cached summary."""
    from app.services.ai_service import summarize_text
    note = Note.query.get_or_404(note_id)
    if not note.extracted_text:
        return jsonify({'error': 'No text content available'}), 400

    if not note.summary:
        try:
            note.summary = summarize_text(note.extracted_text)
            db.session.commit()
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    return jsonify({'summary': note.summary})


@notes_bp.route('/<int:note_id>/download', methods=['GET'])
def download_note(note_id):
    note = Note.query.get_or_404(note_id)
    directory = os.path.join(current_app.config['UPLOAD_FOLDER'], 'notes')
    return send_from_directory(directory, note.filename, as_attachment=True, download_name=note.original_name)


@notes_bp.route('/<int:note_id>', methods=['DELETE'])
def delete_note(note_id):
    note = Note.query.get_or_404(note_id)
    try:
        if os.path.exists(note.file_path):
            os.remove(note.file_path)
        delete_document(f"note_{note.id}")
    except Exception:
        pass
    db.session.delete(note)
    db.session.commit()
    return jsonify({'message': 'Note deleted'})
