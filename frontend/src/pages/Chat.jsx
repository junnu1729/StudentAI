import { useState, useEffect, useRef } from 'react'
import { Send, Bot, User, Plus, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import Spinner from '../components/Spinner'
import { askQuestion, getChatHistory, listNotes, listSessions, deleteSession } from '../api'

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID())
  const [notes, setNotes] = useState([])
  const [selectedNote, setSelectedNote] = useState('')
  const [sessions, setSessions] = useState([])
  const bottomRef = useRef(null)

  useEffect(() => {
    listNotes().then(r => setNotes(r.data)).catch(() => {})
    listSessions().then(r => setSessions(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadSession(sid) {
    setSessionId(sid)
    const res = await getChatHistory(sid)
    setMessages(res.data.map(m => ({ role: m.role, content: m.content })))
  }

  function newChat() {
    setSessionId(crypto.randomUUID())
    setMessages([])
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!input.trim() || loading) return
    const question = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: question }])
    setLoading(true)
    try {
      const res = await askQuestion({
        question,
        note_id: selectedNote || null,
        session_id: sessionId
      })
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.answer }])
      listSessions().then(r => setSessions(r.data)).catch(() => {})
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ ' + (err.response?.data?.error || 'Something went wrong') }])
    }
    setLoading(false)
  }

  async function handleDeleteSession(sid, e) {
    e.stopPropagation()
    await deleteSession(sid)
    setSessions(sessions.filter(s => s.session_id !== sid))
    if (sid === sessionId) newChat()
  }

  return (
    <div className="flex h-screen md:h-[calc(100vh-0px)] overflow-hidden">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <button onClick={newChat} className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>
        <div className="p-3">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Context Note</label>
          <select className="input mt-1 text-sm" value={selectedNote} onChange={e => setSelectedNote(e.target.value)}>
            <option value="">All uploaded notes</option>
            {notes.map(n => <option key={n.id} value={n.id}>{n.original_name}</option>)}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          {sessions.map(s => (
            <div
              key={s.session_id}
              onClick={() => loadSession(s.session_id)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
                s.session_id === sessionId ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              <span className="truncate">{new Date(s.started_at).toLocaleDateString()} ({s.message_count} msgs)</span>
              <button onClick={(e) => handleDeleteSession(s.session_id, e)} className="ml-1 p-0.5 hover:text-red-500">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
              <Bot className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium">Ask anything about your notes</p>
              <p className="text-sm mt-1">Upload notes first for context-aware answers</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-sm'
              }`}>
                {msg.role === 'assistant'
                  ? <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">{msg.content}</ReactMarkdown>
                  : msg.content
                }
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2">
                <Spinner size="sm" />
                <span className="text-sm text-gray-500">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-4">
          <form onSubmit={handleSend} className="flex gap-3 max-w-3xl mx-auto">
            <input
              className="input flex-1"
              placeholder="Ask a question about your notes..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()} className="btn-primary px-4">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
