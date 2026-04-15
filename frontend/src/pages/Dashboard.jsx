import { useState, useEffect } from 'react'
import { FileText, Sparkles, CheckCircle, XCircle, Trophy, BookOpen, RefreshCw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import Spinner from '../components/Spinner'
import { listNotes, summarizeNote, generateQuiz, submitQuiz, listQuizzes } from '../api'

export default function Dashboard() {
  const [notes, setNotes] = useState([])
  const [notesLoading, setNotesLoading] = useState(true)
  const [selectedNote, setSelectedNote] = useState('')
  const [summary, setSummary] = useState('')
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState('')
  const [quiz, setQuiz] = useState(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [pastQuizzes, setPastQuizzes] = useState([])
  const [numQ, setNumQ] = useState(5)

  useEffect(() => {
    fetchNotes()
    listQuizzes().then(r => setPastQuizzes(Array.isArray(r.data) ? r.data : [])).catch(() => {})
  }, [])

  async function fetchNotes() {
    setNotesLoading(true)
    try {
      const res = await listNotes()
      const data = Array.isArray(res.data) ? res.data : []
      setNotes(data)
      // Auto-select first note if none selected
      if (data.length > 0 && !selectedNote) {
        setSelectedNote(String(data[0].id))
      }
    } catch (err) {
      console.error('Failed to load notes:', err)
      setNotes([])
    }
    setNotesLoading(false)
  }

  async function handleSummarize() {
    if (!selectedNote) return
    setSummaryLoading(true); setSummary(''); setSummaryError('')
    try {
      const res = await summarizeNote(selectedNote)
      setSummary(res.data.summary)
    } catch (err) {
      setSummaryError('Error: ' + (err.response?.data?.error || 'Failed to summarize. Check your API key.'))
    }
    setSummaryLoading(false)
  }

  async function handleGenerateQuiz() {
    if (!selectedNote) return
    setQuizLoading(true); setQuiz(null); setAnswers({}); setResult(null)
    try {
      const res = await generateQuiz({ note_id: parseInt(selectedNote), num_questions: numQ })
      setQuiz(res.data)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to generate quiz. Check your API key.')
    }
    setQuizLoading(false)
  }

  async function handleSubmitQuiz() {
    if (!quiz) return
    setSubmitting(true)
    try {
      const res = await submitQuiz(quiz.quiz_id, answers)
      setResult(res.data)
      listQuizzes().then(r => setPastQuizzes(Array.isArray(r.data) ? r.data : [])).catch(() => {})
    } catch (err) {
      alert(err.response?.data?.error || 'Submission failed')
    }
    setSubmitting(false)
  }

  const scoreColor = (pct) => pct >= 80 ? 'text-green-500' : pct >= 50 ? 'text-yellow-500' : 'text-red-500'
  const selectedNoteObj = notes.find(n => String(n.id) === String(selectedNote))

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Generate summaries and practice quizzes from your notes.</p>
      </div>

      {/* Note selector */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select a Note</label>
          <button onClick={fetchNotes} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg" title="Refresh">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {notesLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400"><Spinner size="sm" /> Loading notes...</div>
        ) : notes.length === 0 ? (
          <div className="text-sm text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
            No notes uploaded yet. <a href="/upload" className="text-blue-500 underline">Upload a note first</a>
          </div>
        ) : (
          <select
            className="input"
            value={selectedNote}
            onChange={e => { setSelectedNote(e.target.value); setSummary(''); setSummaryError(''); setQuiz(null); setResult(null) }}
          >
            <option value="">-- Choose a note --</option>
            {notes.map(n => (
              <option key={n.id} value={n.id}>{n.original_name} ({n.subject})</option>
            ))}
          </select>
        )}

        {selectedNoteObj && (
          <p className="text-xs text-gray-400 mt-2">
            {selectedNoteObj.subject} · {(selectedNoteObj.file_size / 1024).toFixed(0)} KB · uploaded {new Date(selectedNoteObj.created_at).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Summary */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white">AI Summary</h2>
          </div>
          <button
            onClick={handleSummarize}
            disabled={!selectedNote || summaryLoading}
            className="btn-primary text-sm flex items-center gap-2"
          >
            {summaryLoading ? <><Spinner size="sm" /> Summarizing...</> : 'Generate Summary'}
          </button>
        </div>
        {summaryError && <p className="text-red-500 text-sm mb-2">{summaryError}</p>}
        {summary ? (
          <div className="prose prose-sm dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-6">
            {selectedNote ? 'Click Generate Summary to summarize this note' : 'Select a note above first'}
          </p>
        )}
      </div>

      {/* Quiz */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Practice Quiz</h2>
          </div>
          <div className="flex items-center gap-3">
            <select className="input w-28 text-sm" value={numQ} onChange={e => setNumQ(Number(e.target.value))}>
              {[3, 5, 7, 10].map(n => <option key={n} value={n}>{n} questions</option>)}
            </select>
            <button
              onClick={handleGenerateQuiz}
              disabled={!selectedNote || quizLoading}
              className="btn-primary text-sm flex items-center gap-2"
            >
              {quizLoading ? <><Spinner size="sm" /> Generating...</> : 'Generate Quiz'}
            </button>
          </div>
        </div>

        {quiz && !result && (
          <div className="space-y-5">
            {quiz.questions.map((q, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="font-medium text-sm mb-3">{i + 1}. {q.question}</p>
                <div className="space-y-2">
                  {q.options.map((opt, j) => {
                    const letter = String.fromCharCode(65 + j)
                    return (
                      <label key={j} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                        answers[i] === letter ? 'bg-blue-100 dark:bg-blue-900/40 border border-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}>
                        <input type="radio" name={`q${i}`} value={letter} checked={answers[i] === letter}
                          onChange={() => setAnswers({ ...answers, [i]: letter })} className="hidden" />
                        <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          answers[i] === letter ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 dark:border-gray-600'
                        }`}>{letter}</span>
                        <span className="text-sm">{opt}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
            <button
              onClick={handleSubmitQuiz}
              disabled={Object.keys(answers).length < quiz.questions.length || submitting}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {submitting ? <><Spinner size="sm" /> Submitting...</> : 'Submit Quiz'}
            </button>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <Trophy className="w-12 h-12 mx-auto mb-2 text-yellow-500" />
              <p className={`text-4xl font-bold ${scoreColor(result.percentage)}`}>{result.percentage}%</p>
              <p className="text-gray-500 mt-1">{result.score} / {result.total} correct</p>
            </div>
            {result.results.map((r, i) => (
              <div key={i} className={`p-4 rounded-lg border ${r.is_correct
                ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800'
                : 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800'}`}>
                <div className="flex items-start gap-2">
                  {r.is_correct
                    ? <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    : <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />}
                  <div>
                    <p className="text-sm font-medium">{i + 1}. {r.question}</p>
                    {!r.is_correct && <p className="text-xs text-red-600 dark:text-red-400 mt-1">Your answer: {r.user_answer} · Correct: {r.correct_answer}</p>}
                    {r.explanation && <p className="text-xs text-gray-500 mt-1">{r.explanation}</p>}
                  </div>
                </div>
              </div>
            ))}
            <button onClick={() => { setQuiz(null); setResult(null); setAnswers({}) }} className="btn-secondary w-full">Try Again</button>
          </div>
        )}

        {!quiz && !result && (
          <p className="text-sm text-gray-400 text-center py-6">
            {selectedNote ? 'Click Generate Quiz to create questions from this note' : 'Select a note above first'}
          </p>
        )}
      </div>

      {/* Past quiz scores */}
      {pastQuizzes.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" /> Recent Quiz Scores
          </h2>
          <div className="space-y-2">
            {pastQuizzes.slice(0, 5).map(q => (
              <div key={q.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <span className="text-gray-600 dark:text-gray-400">{new Date(q.created_at).toLocaleDateString()}</span>
                <span className={`font-medium ${q.score != null ? scoreColor((q.score / q.total) * 100) : 'text-gray-400'}`}>
                  {q.score != null ? `${q.score}/${q.total}` : 'Not submitted'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
