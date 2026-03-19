'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Calendar, Search, Download, HelpCircle, LogOut } from 'lucide-react'
import { logout } from '@/app/lib/action'

export function Header() {
  const [currentDate, setCurrentDate] = useState('')
  const [currentTime, setCurrentTime] = useState('')
  const [language, setLanguage] = useState('ENG')

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date()
      
      const date = now.toLocaleDateString('fi-FI', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '.')
      
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
    <header className="h-[80px] bg-white border-b border-gray-200 flex items-center justify-between px-8">
      {/* Left - Logo/Brand + Admin Tool label */}
      <div className="flex items-center gap-3">
        <Image
          src="/stelthion-brandmark.png"
          alt="Stelthion"
          width={220}
          height={60}
          className="object-contain"
        />
        <div className="w-px h-8 bg-gray-300" />
        <span className="text-sm font-semibold text-gray-600 tracking-wide">Admin Tool</span>
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

        <div className="w-px h-6 bg-gray-200" />

        {/* Logout Button */}
        <form action={logout}>
          <button 
            type="submit"
            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </form>
      </div>
    </header>
  )
}