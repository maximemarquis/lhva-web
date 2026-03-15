'use client'
import { useState } from 'react'
import { AdminSidebar } from './AdminSidebar'

interface Props {
  userEmail: string
  userName?: string
  role: string
  children: React.ReactNode
}

export function AdminShell({ userEmail, userName, role, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-rink-900">
      <AdminSidebar
        userEmail={userEmail}
        userName={userName}
        role={role}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-rink-800 border-b border-white/[0.07] sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1 text-muted hover:text-white transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-[14px] font-black">LHVA Admin</span>
        </div>
        {children}
      </div>
    </div>
  )
}
