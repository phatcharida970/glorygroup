'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
      <div className="w-full max-w-sm p-8 rounded-2xl bg-[#1a1a1a] border border-[#C9922A]/30 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo.jpg" alt="Glorygroup" width={80} height={80} className="rounded-full mb-3" />
          <h1 className="text-2xl font-bold text-[#C9922A]">Glorygroup</h1>
          <p className="text-sm text-gray-400 mt-1">ระบบจัดการหลังบ้าน</p>
        </div>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="อีเมล"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="px-4 py-3 rounded-lg bg-[#242424] border border-[#333] text-white placeholder-gray-500 focus:outline-none focus:border-[#C9922A]"
          />
          <input
            type="password"
            placeholder="รหัสผ่าน"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="px-4 py-3 rounded-lg bg-[#242424] border border-[#333] text-white placeholder-gray-500 focus:outline-none focus:border-[#C9922A]"
          />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="py-3 rounded-lg bg-[#C9922A] hover:bg-[#E8B84B] text-black font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>
      </div>
    </div>
  )
}
