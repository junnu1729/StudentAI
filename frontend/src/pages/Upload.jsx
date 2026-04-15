import { useState, useEffect } from 'react'
import { Trash2, Download, FileText, RefreshCw } from 'lucide-react'
import FileDropzone from '../components/FileDropzone'
import Spinner from '../components/Spinner'
import { uploadNote, listNotes, deleteNote, downloadNote } from '../api'

export default function Upload() {
  const [file, setFile] = useState(null)
  const [subject, setSubject] = useState('')
  const [notes, setNotes] = useState([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { fetchNotes() }, [])

  async function fetchNotes() {
    setLoading(true)
    try {
      const res = await listNotes()
      setNotes(Array.isArray(res.data) ? res.data : [])
    } catch { setNotes([]) }
    setLoading(false)
  }

  async function handleUpload(e) {
    e.preventDefault()
    if (!file) return setError('Please select a file')
    setError(''); setSuccess(''); setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('subject', subject || 'General')
    try {
      await uploadNote(fd)
      setSuccess('Note uploaded and indexed successfully!')
      setFile(null); setSubject('')
      fetchNotes()
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed')
    }
    setUploading(false)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this note?')) return
    await deleteNote(id)
    setNotes(notes.filter(n => n.id !== id))
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Upload Notes</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">Upload PDFs or text files to enable AI-powered Q&A and summaries.</p>

      {/* Upload form */}
      <div className="card p-6 mb-8">
        <form onSubmit={handleUpload} className="space-y-4">
          <FileDropzone file={file} onDrop={setFile} onClear={() => setFile(null)} />
          <input
            className="input"
            placeholder="Subject (e.g. Physics, Math)"
            value={subject}
            onChange={e => setSubject(e.target.value)}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">{success}</p>}
          <button type="submit" disabled={uploading || !file} className="btn-primary w-full flex items-center justify-center gap-2">
            {uploading ? <><Spinner size="sm" /> Processing...</> : 'Upload & Index'}
          </button>
        </form>
      </div>

      {/* Notes list */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">Uploaded Notes ({notes.length})</h2>
        <button onClick={fetchNotes} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Spinner size="lg" /></div>
      ) : notes.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No notes uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <div key={note.id} className="card p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{note.original_name}</p>
                <p className="text-xs text-gray-500">{note.subject} · {(note.file_size / 1024).toFixed(1)} KB · {new Date(note.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <a href={downloadNote(note.id)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg" title="Download">
                  <Download className="w-4 h-4 text-gray-500" />
                </a>
                <button onClick={() => handleDelete(note.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Delete">
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
