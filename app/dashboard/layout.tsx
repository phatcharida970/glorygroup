'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/dashboard', label: 'หน้าหลัก', icon: '🏠' },
  { href: '/dashboard/agents', label: 'ตัวแทน', icon: '👤' },
  { href: '/dashboard/documents', label: 'ฝากส่งเอกสาร', icon: '📄' },
  { href: '/dashboard/expenses', label: 'บัญชีรายจ่าย', icon: '💰' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login')
      else setLoading(false)
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
      <div className="text-[#C9922A]">กำลังโหลด...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#1a1a1a] border-b border-[#C9922A]/20">
        <div className="flex items-center gap-2">
          <Image src="/logo.jpg" alt="Glorygroup" width={32} height={32} className="rounded-full" />
          <span className="text-[#C9922A] font-bold">Glorygroup</span>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} className="text-gray-400 text-2xl">
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-[#1a1a1a] border-b border-[#C9922A]/20 z-50">
          {navItems.map(item => (
            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-5 py-4 text-base border-b border-[#242424] ${
                pathname === item.href ? 'text-[#C9922A] font-semibold bg-[#C9922A]/10' : 'text-gray-400'
              }`}>
              <span>{item.icon}</span>{item.label}
            </Link>
          ))}
          <button onClick={handleLogout} className="w-full text-left px-5 py-4 text-red-400 text-base">
            ออกจากระบบ
          </button>
        </div>
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-56 min-h-screen bg-[#1a1a1a] border-r border-[#C9922A]/20 flex-col">
          <div className="flex flex-col items-center py-6 border-b border-[#C9922A]/20">
            <Image src="/logo.jpg" alt="Glorygroup" width={56} height={56} className="rounded-full mb-2" />
            <span className="text-[#C9922A] font-bold text-lg">Glorygroup</span>
          </div>
          <nav className="flex-1 py-4">
            {navItems.map(item => (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                  pathname === item.href
                    ? 'bg-[#C9922A]/20 text-[#C9922A] font-semibold border-r-2 border-[#C9922A]'
                    : 'text-gray-400 hover:text-white hover:bg-[#242424]'
                }`}>
                <span>{item.icon}</span>{item.label}
              </Link>
            ))}
          </nav>
          <button onClick={handleLogout} className="mx-4 mb-6 py-2 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors">
            ออกจากระบบ
          </button>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#C9922A]/20 flex z-40">
        {navItems.map(item => (
          <Link key={item.href} href={item.href}
            className={`flex-1 flex flex-col items-center py-3 text-xs gap-1 ${
              pathname === item.href ? 'text-[#C9922A]' : 'text-gray-500'
            }`}>
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* bottom nav spacer on mobile */}
      <div className="md:hidden h-20" />
    </div>
  )
}
