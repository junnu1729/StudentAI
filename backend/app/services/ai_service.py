"""AI service using Google Gemini REST API (works on Python 3.7)"""
import os
import json
import re
import requests


GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"


def _call_ai(prompt: str) -> str:
    """Send a prompt to Gemini and return the response text."""
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not set in .env file")

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"maxOutputTokens": 2000, "temperature": 0.7}
    }

    response = requests.post(
        "{}?key={}".format(GEMINI_URL, api_key),
        json=payload,
        timeout=60
    )

    if response.status_code != 200:
        raise RuntimeError("Gemini API error {}: {}".format(response.status_code, response.text))

    data = response.json()
    try:
        return data['candidates'][0]['content']['parts'][0]['text']
    except (KeyError, IndexError) as e:
        raise RuntimeError("Unexpected Gemini response: {}".format(data))


def answer_question(question: str, context: str, chat_history=None) -> str:
    """Answer a question based strictly on the provided context."""
    history_text = ""
    if chat_history:
        for msg in chat_history[-6:]:
            role = "Student" if msg['role'] == 'user' else "Assistant"
            history_text += "{}: {}\n".format(role, msg['content'])

    prompt = """You are a helpful study assistant. Answer the student's question based ONLY on the provided study material.
If the answer is not in the material, say "I couldn't find that in the uploaded material."

Study Material:
{context}

{history}
Student's Question: {question}

Provide a clear, concise answer:""".format(
        context=context[:4000],
        history="Previous conversation:\n{}".format(history_text) if history_text else "",
        question=question
    )
    return _call_ai(prompt)


def summarize_text(text: str) -> str:
    """Generate a structured summary of study notes."""
    prompt = """Summarize the following study material in a clear, structured format.
Include:
- Main topics covered
- Key concepts and definitions
- Important points to remember
- Any formulas or rules mentioned

Study Material:
{text}

Summary:""".format(text=text[:5000])
    return _call_ai(prompt)


def generate_quiz(text: str, num_questions: int = 5) -> list:
    """Generate MCQ quiz questions from study material."""
    prompt = """Generate {n} multiple choice questions from the following study material.

Return ONLY a valid JSON array with this exact structure:
[
  {{
    "question": "Question text here?",
    "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
    "correct": "A",
    "explanation": "Brief explanation of why this is correct"
  }}
]

Study Material:
{text}

JSON Array:""".format(n=num_questions, text=text[:4000])

    raw = _call_ai(prompt)
    match = re.search(r'\[.*\]', raw, re.DOTALL)
    if match:
        return json.loads(match.group())
    raise ValueError("Could not parse quiz questions from AI response")


def analyze_papers_for_trends(papers_text, subject: str) -> dict:
    """Analyze multiple papers to find frequently asked questions and trends."""
    combined = "\n\n---PAPER SEPARATOR---\n\n".join(papers_text[:5])
    prompt = """Analyze these {subject} exam papers and identify:
1. Frequently asked topics
2. Important questions likely to appear again
3. Predicted questions for next exam

Papers:
{papers}

Return ONLY valid JSON:
{{
  "frequent_topics": ["topic1", "topic2"],
  "important_questions": ["question1", "question2"],
  "topic_frequency": {{"topic": 1}},
  "predicted_questions": ["question1", "question2"]
}}""".format(subject=subject, papers=combined[:6000])

    raw = _call_ai(prompt)
    match = re.search(r'\{.*\}', raw, re.DOTALL)
    if match:
        return json.loads(match.group())
    return {"frequent_topics": [], "important_questions": [], "topic_frequency": {}, "predicted_questions": []}


def extract_important_questions(text: str) -> list:
    """Extract important questions from a question paper."""
    prompt = """Extract all questions from this exam paper. Return ONLY a JSON array of question strings.

Paper:
{text}

JSON Array of questions:""".format(text=text[:4000])

    raw = _call_ai(prompt)
    match = re.search(r'\[.*\]', raw, re.DOTALL)
    if match:
        return json.loads(match.group())
    return []
