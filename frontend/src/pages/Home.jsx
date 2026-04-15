import { Link } from 'react-router-dom'
import { Upload, MessageSquare, LayoutDashboard, FileText, Sparkles, Brain, TrendingUp, BookOpen } from 'lucide-react'

const features = [
  { icon: Upload, title: 'Upload Notes', desc: 'Upload PDFs or text files and extract content instantly.', to: '/upload', color: 'bg-blue-500' },
  { icon: MessageSquare, title: 'AI Chat', desc: 'Ask questions about your notes and get instant answers.', to: '/chat', color: 'bg-purple-500' },
  { icon: LayoutDashboard, title: 'Dashboard', desc: 'View summaries, take quizzes, and track your progress.', to: '/dashboard', color: 'bg-green-500' },
  { icon: FileText, title: 'Past Papers', desc: 'Browse previous year papers and analyze exam trends.', to: '/papers', color: 'bg-orange-500' }
]

const highlights = [
  { icon: Brain, text: 'Context-aware Q&A powered by AI' },
  { icon: Sparkles, text: 'Auto-generate summaries and MCQ quizzes' },
  { icon: TrendingUp, text: 'Analyze exam trends from past papers' },
  { icon: BookOpen, text: 'Predict important questions for exams' }
]

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Hero */}
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <Sparkles className="w-4 h-4" />
          AI-Powered Study Assistant
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
          Study Smarter,<br />Not Harder
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto mb-8">
          Upload your notes, chat with AI, generate quizzes, and analyze past exam papers — all in one place.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/upload" className="btn-primary flex items-center gap-2">
            <Upload className="w-4 h-4" /> Get Started
          </Link>
          <Link to="/chat" className="btn-secondary flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Try Chat
          </Link>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-14">
        {features.map(({ icon: Icon, title, desc, to, color }) => (
          <Link key={to} to={to} className="card p-6 hover:shadow-md transition-shadow group">
            <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center mb-4`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
          </Link>
        ))}
      </div>

      {/* Highlights */}
      <div className="card p-8">
        <h2 className="font-bold text-xl text-gray-900 dark:text-white mb-6 text-center">What StudyAI can do</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {highlights.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
