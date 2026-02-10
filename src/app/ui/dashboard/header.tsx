'use client'

import { useState, useEffect } from 'react'
import { Calendar, Search, Download, HelpCircle } from 'lucide-react'

export function Header() {
  const [currentDate, setCurrentDate] = useState('')
  const [currentTime, setCurrentTime] = useState('')
  const [language, setLanguage] = useState('ENG')

  useEffect(() => {
    // Update time every second
    const updateDateTime = () => {
      const now = new Date()
      
      // Format date: DD.MM.YYYY
      const date = now.toLocaleDateString('fi-FI', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '.')
      
      // Format time: HH:MM
      const time = now.toLocaleTimeString('fi-FI', {
        hour: '2-digit',
        minute: '2-digit'
      })
      
      setCurrentDate(date)
      setCurrentTime(time)
    }

    updateDateTime()
    const interval = setInterval(updateDateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Left - Logo/Brand */}
      <div className="flex items-center gap-2">
        <span className="text-xl font-semibold text-gray-900">stelthion</span>
        <span className="text-xs text-gray-400">Synexis™</span>
      </div>

      {/* Center - Date & Time */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span>{currentDate}</span>
          <Calendar size={16} />
        </div>
        <span>{currentTime}</span>
        <HelpCircle size={16} className="text-gray-400 cursor-pointer hover:text-gray-600" />
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-4">
        <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <Search size={16} />
          <span>Ask Stelthion</span>
        </button>
        
        {/* Language Dropdown */}
        <select 
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="text-sm text-gray-600 bg-white border border-gray-200 rounded-md px-2 py-1 outline-none cursor-pointer hover:border-gray-300"
        >
          <option value="ENG">ENG</option>
          <option value="FIN">FIN</option>
        </select>

        <div className="w-px h-6 bg-gray-200" />

        <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <Download size={16} />
          <span>Export</span>
        </button>
      </div>
    </header>
  )
}