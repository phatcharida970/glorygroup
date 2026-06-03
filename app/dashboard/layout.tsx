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
    <div className="flex min-h-screen bg-[#0f0f0f]">
      {/* Sidebar */}
      <aside className="w-56 bg-[#1a1a1a] border-r border-[#C9922A]/20 flex flex-col">
        <div className="flex flex-col items-center py-6 border-b border-[#C9922A]/20">
          <Image src="/logo.jpg" alt="Glorygroup" width={56} height={56} className="rounded-full mb-2" />
          <span className="text-[#C9922A] font-bold text-lg">Glorygroup</span>
        </div>
        <nav className="flex-1 py-4">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                pathname === item.href
                  ? 'bg-[#C9922A]/20 text-[#C9922A] font-semibold border-r-2 border-[#C9922A]'
                  : 'text-gray-400 hover:text-white hover:bg-[#242424]'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="mx-4 mb-6 py-2 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
        >
          ออกจากระบบ
        </button>
      </aside>
      {/* Main */}
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  )
}
