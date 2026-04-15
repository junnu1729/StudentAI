import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import Home from './pages/Home'
import Upload from './pages/Upload'
import Chat from './pages/Chat'
import Dashboard from './pages/Dashboard'
import Papers from './pages/Papers'

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout darkMode={darkMode} setDarkMode={setDarkMode} />}>
          <Route index element={<Home />} />
          <Route path="upload" element={<Upload />} />
          <Route path="chat" element={<Chat />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="papers" element={<Papers />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
