'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Expense = {
  id: string
  date: string
  category: string
  description: string
  employee_name: string | null
  amount: number
  note: string | null
}

const categories = ['เงินเดือนพนักงาน', 'ค่าเช่า', 'ค่าสาธารณูปโภค', 'ค่าวัสดุ', 'ค่าขนส่ง', 'อื่นๆ']

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ date: '', category: categories[0], description: '', employee_name: '', amount: '', note: '' })
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const supabase = createClient()

  useEffect(() => { fetchExpenses() }, [month])

  async function fetchExpenses() {
    setLoading(true)
    const { data } = await supabase
      .from('gg_expenses')
      .select('*')
      .gte('date', `${month}-01`)
      .lte('date', `${month}-31`)
      .order('date', { ascending: false })
    setExpenses(data || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('gg_expenses').insert([{
      ...form,
      amount: parseFloat(form.amount),
      employee_name: form.employee_name || null,
      note: form.note || null
    }])
    setForm({ date: '', category: categories[0], description: '', employee_name: '', amount: '', note: '' })
    setShowForm(false)
    fetchExpenses()
  }

  async function handleDelete(id: string) {
    if (!confirm('ยืนยันการลบ?')) return
    await supabase.from('gg_expenses').delete().eq('id', id)
    fetchExpenses()
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0)
  const byCat = categories.map(cat => ({
    cat,
    total: expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0)
  })).filter(c => c.total > 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#C9922A]">บัญชีรายจ่าย</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[#C9922A] hover:bg-[#E8B84B] text-black rounded-lg font-semibold text-sm transition-colors">
          + เพิ่มรายจ่าย
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <label className="text-gray-400 text-sm">เดือน:</label>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white focus:outline-none focus:border-[#C9922A]" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <div className="bg-[#1a1a1a] border border-[#C9922A]/30 rounded-xl p-4 col-span-2 md:col-span-1">
          <p className="text-gray-400 text-xs mb-1">รวมรายจ่ายทั้งหมด</p>
          <p className="text-2xl font-bold text-[#C9922A]">{total.toLocaleString()} <span className="text-sm font-normal">บาท</span></p>
        </div>
        {byCat.map(c => (
          <div key={c.cat} className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">{c.cat}</p>
            <p className="text-lg font-semibold text-white">{c.total.toLocaleString()} <span className="text-xs font-normal text-gray-400">บาท</span></p>
          </div>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#1a1a1a] border border-[#C9922A]/30 rounded-xl p-6 mb-6 grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">วันที่</label>
            <input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[#242424] border border-[#333] text-white focus:outline-none focus:border-[#C9922A]" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">หมวดหมู่</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[#242424] border border-[#333] text-white focus:outline-none focus:border-[#C9922A]">
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <input required placeholder="รายละเอียด" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            className="px-3 py-2 rounded-lg bg-[#242424] border border-[#333] text-white placeholder-gray-500 focus:outline-none focus:border-[#C9922A]" />
          <input placeholder="ชื่อพนักงาน (ถ้ามี)" value={form.employee_name} onChange={e => setForm({ ...form, employee_name: e.target.value })}
            className="px-3 py-2 rounded-lg bg-[#242424] border border-[#333] text-white placeholder-gray-500 focus:outline-none focus:border-[#C9922A]" />
          <input required type="number" placeholder="จำนวนเงิน (บาท)" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
            className="px-3 py-2 rounded-lg bg-[#242424] border border-[#333] text-white placeholder-gray-500 focus:outline-none focus:border-[#C9922A]" />
          <input placeholder="หมายเหตุ" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
            className="px-3 py-2 rounded-lg bg-[#242424] border border-[#333] text-white placeholder-gray-500 focus:outline-none focus:border-[#C9922A]" />
          <div className="col-span-2 flex gap-2">
            <button type="submit" className="flex-1 py-2 bg-[#C9922A] text-black rounded-lg font-semibold text-sm">บันทึก</button>
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 bg-[#242424] text-gray-400 rounded-lg text-sm">ยกเลิก</button>
          </div>
        </form>
      )}

      {loading ? <div className="text-gray-400">กำลังโหลด...</div> : (
        <div className="bg-[#1a1a1a] border border-[#C9922A]/20 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#333] text-gray-400">
                <th className="text-left px-4 py-3">วันที่</th>
                <th className="text-left px-4 py-3">หมวดหมู่</th>
                <th className="text-left px-4 py-3">รายละเอียด</th>
                <th className="text-left px-4 py-3">พนักงาน</th>
                <th className="text-left px-4 py-3">จำนวนเงิน</th>
                <th className="text-left px-4 py-3">หมายเหตุ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">ยังไม่มีข้อมูลเดือนนี้</td></tr>
              ) : expenses.map(exp => (
                <tr key={exp.id} className="border-b border-[#242424] hover:bg-[#242424]/50">
                  <td className="px-4 py-3 text-gray-400">{new Date(exp.date).toLocaleDateString('th-TH')}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs bg-[#C9922A]/20 text-[#C9922A]">{exp.category}</span>
                  </td>
                  <td className="px-4 py-3 text-white">{exp.description}</td>
                  <td className="px-4 py-3 text-gray-400">{exp.employee_name || '-'}</td>
                  <td className="px-4 py-3 text-white font-medium">{exp.amount.toLocaleString()} บาท</td>
                  <td className="px-4 py-3 text-gray-400">{exp.note || '-'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(exp.id)} className="text-red-400 hover:text-red-300 text-xs">ลบ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
