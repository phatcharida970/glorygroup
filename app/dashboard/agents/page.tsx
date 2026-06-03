'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Agent = {
  id: string
  name: string
  code: string
  license_number: string
  license_expiry: string
  phone: string
  created_at: string
}

function toThaiDate(isoDate: string): string {
  const d = new Date(isoDate)
  const day = d.getDate()
  const month = d.getMonth() + 1
  const year = d.getFullYear() + 543
  return `${day}/${month}/${year}`
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', code: '', license_number: '', license_expiry: '', phone: '' })
  const supabase = createClient()

  useEffect(() => { fetchAgents() }, [])

  async function fetchAgents() {
    const { data } = await supabase.from('gg_agents').select('*').order('license_expiry')
    setAgents(data || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('gg_agents').insert([{ ...form, user_id: user?.id }])
    setForm({ name: '', code: '', license_number: '', license_expiry: '', phone: '' })
    setShowForm(false)
    fetchAgents()
  }

  async function handleDelete(id: string) {
    if (!confirm('ยืนยันการลบ?')) return
    await supabase.from('gg_agents').delete().eq('id', id)
    fetchAgents()
  }

  function expiryStatus(date: string) {
    const diff = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (diff < 0) return { label: 'หมดอายุแล้ว', color: 'text-red-400 bg-red-400/10' }
    if (diff <= 30) return { label: `อีก ${diff} วัน`, color: 'text-yellow-400 bg-yellow-400/10' }
    return { label: `อีก ${diff} วัน`, color: 'text-green-400 bg-green-400/10' }
  }

  const inputClass = "px-3 py-2 rounded-lg bg-[#242424] border border-[#333] text-white placeholder-gray-500 focus:outline-none focus:border-[#C9922A]"

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#C9922A]">จัดการตัวแทน</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[#C9922A] hover:bg-[#E8B84B] text-black rounded-lg font-semibold text-sm transition-colors">
          + เพิ่มตัวแทน
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#1a1a1a] border border-[#C9922A]/30 rounded-xl p-6 mb-6 grid grid-cols-2 gap-4">
          <input required placeholder="ชื่อ-นามสกุล" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} />
          <input placeholder="รหัสตัวแทน" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className={inputClass} />
          <input placeholder="เลขที่ใบอนุญาต" value={form.license_number} onChange={e => setForm({ ...form, license_number: e.target.value })} className={inputClass} />
          <input placeholder="เบอร์โทร" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass} />
          <div>
            <label className="text-xs text-gray-400 mb-1 block">วันหมดอายุใบอนุญาต</label>
            <input required type="date" value={form.license_expiry} onChange={e => setForm({ ...form, license_expiry: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[#242424] border border-[#333] text-white focus:outline-none focus:border-[#C9922A]" />
            {form.license_expiry && (
              <p className="text-xs text-[#C9922A] mt-1">พ.ศ. {new Date(form.license_expiry).getFullYear() + 543}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 py-2 bg-[#C9922A] text-black rounded-lg font-semibold text-sm">บันทึก</button>
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 bg-[#242424] text-gray-400 rounded-lg text-sm">ยกเลิก</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-gray-400">กำลังโหลด...</div>
      ) : (
        <div className="bg-[#1a1a1a] border border-[#C9922A]/20 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#333] text-gray-400">
                <th className="text-left px-4 py-3">ชื่อ</th>
                <th className="text-left px-4 py-3">รหัส</th>
                <th className="text-left px-4 py-3">เลขใบอนุญาต</th>
                <th className="text-left px-4 py-3">เบอร์โทร</th>
                <th className="text-left px-4 py-3">หมดอายุ (พ.ศ.)</th>
                <th className="text-left px-4 py-3">สถานะ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {agents.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">ยังไม่มีข้อมูลตัวแทน</td></tr>
              ) : agents.map(agent => {
                const status = expiryStatus(agent.license_expiry)
                return (
                  <tr key={agent.id} className="border-b border-[#242424] hover:bg-[#242424]/50">
                    <td className="px-4 py-3 text-white font-medium">{agent.name}</td>
                    <td className="px-4 py-3 text-gray-400">{agent.code || '-'}</td>
                    <td className="px-4 py-3 text-gray-400">{agent.license_number || '-'}</td>
                    <td className="px-4 py-3 text-gray-400">{agent.phone || '-'}</td>
                    <td className="px-4 py-3 text-gray-400">{toThaiDate(agent.license_expiry)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>{status.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(agent.id)} className="text-red-400 hover:text-red-300 text-xs">ลบ</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
