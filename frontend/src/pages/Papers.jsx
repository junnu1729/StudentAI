import { useState, useEffect } from 'react'
import { FileText, Download, Trash2, TrendingUp, Search, Filter, Star, Upload as UploadIcon } from 'lucide-react'
import FileDropzone from '../components/FileDropzone'
import Spinner from '../components/Spinner'
import { uploadPaper, listPapers, deletePaper, downloadPaper, getSubjects, analyzeTrends, searchPapers } from '../api'

const EXAM_TYPES = ['semester', 'mid', 'final', 'unit', 'practice']

export default function Papers() {
  const [papers, setPapers] = useState([])
  const [subjects, setSubjects] = useState([])
  const [years, setYears] = useState([])
  const [loading, setLoading] = useState(true)
  const [file, setFile] = useState(null)
  const [form, setForm] = useState({ subject: '', year: new Date().getFullYear(), exam_type: 'semester' })
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [filters, setFilters] = useState({ subject: '', year: '', exam_type: '' })
  const [searchQ, setSearchQ] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [showUpload, setShowUpload] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      const [papersRes, subjectsRes] = await Promise.all([listPapers({}), getSubjects()])
      setPapers(papersRes.data)
      setSubjects(subjectsRes.data.subjects)
      setYears(subjectsRes.data.years)
    } catch { /* silent */ }
    setLoading(false)
  }

  async function applyFilters() {
    setLoading(true)
    try {
      const res = await listPapers({ subject: filters.subject, year: filters.year || undefined, exam_type: filters.exam_type })
      setPapers(res.data)
    } catch { /* silent */ }
    setLoading(false)
  }

  async function handleSearch(e) {
    e.preventDefault()
    if (!searchQ.trim()) return fetchAll()
    setLoading(true)
    try {
      const res = await searchPapers(searchQ)
      setPapers(res.data)
    } catch { /* silent */ }
    setLoading(false)
  }

  async function handleUpload(e) {
    e.preventDefault()
    if (!file) return setUploadError('Please select a file')
    if (!form.subject) return setUploadError('Subject is required')
    setUploadError(''); setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('subject', form.subject)
    fd.append('year', form.year)
    fd.append('exam_type', form.exam_type)
    try {
      await uploadPaper(fd)
      setFile(null); setForm({ subject: '', year: new Date().getFullYear(), exam_type: 'semester' })
      setShowUpload(false)
      fetchAll()
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Upload failed')
    }
    setUploading(false)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this paper?')) return
    await deletePaper(id)
    setPapers(papers.filter(p => p.id !== id))
  }

  async function handleAnalyze() {
    if (!filters.subject) return alert('Select a subject to analyze')
    setAnalyzing(true); setAnalysis(null)
    try {
      const res = await analyzeTrends(filters.subject)
      setAnalysis(res.data)
    } catch (err) {
      alert(err.response?.data?.error || 'Analysis failed')
    }
    setAnalyzing(false)
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Previous Year Papers</h1>
          <p className="text-gray-500 dark:text-gray-400">Browse, search, and analyze past exam papers.</p>
        </div>
        <button onClick={() => setShowUpload(!showUpload)} className="btn-primary flex items-center gap-2 text-sm">
          <UploadIcon className="w-4 h-4" /> Upload Paper
        </button>
      </div>

      {/* Upload form */}
      {showUpload && (
        <div className="card p-6">
          <h2 className="font-semibold mb-4">Upload Question Paper</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <FileDropzone file={file} onDrop={setFile} onClear={() => setFile(null)} label="Drop question paper PDF here" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input className="input" placeholder="Subject *" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
              <input className="input" type="number" placeholder="Year *" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} min="2000" max="2030" />
              <select className="input" value={form.exam_type} onChange={e => setForm({ ...form, exam_type: e.target.value })}>
                {EXAM_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            {uploadError && <p className="text-red-500 text-sm">{uploadError}</p>}
            <button type="submit" disabled={uploading || !file} className="btn-primary flex items-center gap-2">
              {uploading ? <><Spinner size="sm" /> Uploading...</> : 'Upload & Extract'}
            </button>
          </form>
        </div>
      )}

      {/* Filters & Search */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-40">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input className="input text-sm" placeholder="Search questions..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
              <button type="submit" className="btn-secondary px-3"><Search className="w-4 h-4" /></button>
            </form>
          </div>
          <select className="input w-40 text-sm" value={filters.subject} onChange={e => setFilters({ ...filters, subject: e.target.value })}>
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="input w-32 text-sm" value={filters.year} onChange={e => setFilters({ ...filters, year: e.target.value })}>
            <option value="">All Years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="input w-36 text-sm" value={filters.exam_type} onChange={e => setFilters({ ...filters, exam_type: e.target.value })}>
            <option value="">All Types</option>
            {EXAM_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          <button onClick={applyFilters} className="btn-primary text-sm flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" /> Filter
          </button>
          <button onClick={handleAnalyze} disabled={analyzing || !filters.subject} className="btn-secondary text-sm flex items-center gap-1.5">
            {analyzing ? <Spinner size="sm" /> : <TrendingUp className="w-3.5 h-3.5" />} Analyze Trends
          </button>
        </div>
      </div>

      {/* Trend Analysis */}
      {analysis && (
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-500" /> Trend Analysis — {filters.subject}</h2>
          {analysis.frequent_topics?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Frequent Topics</p>
              <div className="flex flex-wrap gap-2">{analysis.frequent_topics.map(t => <span key={t} className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2.5 py-1 rounded-full">{t}</span>)}</div>
            </div>
          )}
          {analysis.important_questions?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Important Questions</p>
              <ul className="space-y-1">{analysis.important_questions.slice(0, 5).map((q, i) => <li key={i} className="flex items-start gap-2 text-sm"><Star className="w-3.5 h-3.5 text-yellow-500 mt-0.5 flex-shrink-0" />{q}</li>)}</ul>
            </div>
          )}
          {analysis.predicted_questions?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Predicted Questions</p>
              <ul className="space-y-1">{analysis.predicted_questions.slice(0, 5).map((q, i) => <li key={i} className="text-sm text-gray-600 dark:text-gray-400">• {q}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      {/* Papers list */}
      {loading ? (
        <div className="flex justify-center py-10"><Spinner size="lg" /></div>
      ) : papers.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No papers found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {papers.map(paper => (
            <div key={paper.id} className="card p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{paper.original_name}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs px-2 py-0.5 rounded">{paper.subject}</span>
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs px-2 py-0.5 rounded">{paper.year}</span>
                    <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs px-2 py-0.5 rounded capitalize">{paper.exam_type}</span>
                  </div>
                  {paper.important_questions?.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1.5">{paper.important_questions.length} questions extracted</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <a href={downloadPaper(paper.id)} className="btn-secondary text-xs flex items-center gap-1.5 flex-1 justify-center">
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
                <button onClick={() => handleDelete(paper.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
