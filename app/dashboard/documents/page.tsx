'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Doc = {
  id: string
  sender_name: string
  received_date: string
  department: string
  sent_to_hq_date: string | null
  cost: number | null
  note: string | null
  image_url: string | null
  created_at: string
}

const departments = ['ฝ่ายพิจารณา', 'ฝ่ายสินไหม', 'ฝ่ายบริการ']

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    sender_name: '', received_date: '', department: departments[0],
    sent_to_hq_date: '', cost: '', note: ''
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const supabase = createClient()

  useEffect(() => { fetchDocs() }, [month])

  async function fetchDocs() {
    setLoading(true)
    const { data } = await supabase
      .from('gg_documents')
      .select('*')
      .gte('received_date', `${month}-01`)
      .lte('received_date', `${month}-31`)
      .order('received_date', { ascending: false })
    setDocs(data || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setUploading(true)
    let image_url = null
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `documents/${Date.now()}.${ext}`
      await supabase.storage.from('attachments').upload(path, imageFile)
      const { data } = supabase.storage.from('attachments').getPublicUrl(path)
      image_url = data.publicUrl
    }
    await supabase.from('gg_documents').insert([{
      ...form,
      cost: form.cost ? parseFloat(form.cost) : null,
      sent_to_hq_date: form.sent_to_hq_date || null,
      image_url
    }])
    setForm({ sender_name: '', received_date: '', department: departments[0], sent_to_hq_date: '', cost: '', note: '' })
    setImageFile(null)
    setShowForm(false)
    setUploading(false)
    fetchDocs()
  }

  async function handleDelete(id: string) {
    if (!confirm('ยืนยันการลบ?')) return
    await supabase.from('gg_documents').delete().eq('id', id)
    fetchDocs()
  }

  const totalCost = docs.reduce((sum, d) => sum + (d.cost || 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#C9922A]">ฝากส่งเอกสาร</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[#C9922A] hover:bg-[#E8B84B] text-black rounded-lg font-semibold text-sm transition-colors">
          + เพิ่มรายการ
        </button>
      </div>

      {/* Filter month */}
      <div className="flex items-center gap-3 mb-6">
        <label className="text-gray-400 text-sm">เดือน:</label>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white focus:outline-none focus:border-[#C9922A]" />
        <div className="ml-auto text-sm text-gray-400">
          รวม <span className="text-white font-semibold">{docs.length}</span> รอบ |
          ค่าใช้จ่าย <span className="text-[#C9922A] font-semibold">{totalCost.toLocaleString()} บาท</span>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#1a1a1a] border border-[#C9922A]/30 rounded-xl p-6 mb-6 grid grid-cols-2 gap-4">
          <input required placeholder="ชื่อผู้ส่ง" value={form.sender_name} onChange={e => setForm({ ...form, sender_name: e.target.value })}
            className="px-3 py-2 rounded-lg bg-[#242424] border border-[#333] text-white placeholder-gray-500 focus:outline-none focus:border-[#C9922A]" />
          <div>
            <label className="text-xs text-gray-400 mb-1 block">วันที่ส่งมาสาขา</label>
            <input required type="date" value={form.received_date} onChange={e => setForm({ ...form, received_date: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[#242424] border border-[#333] text-white focus:outline-none focus:border-[#C9922A]" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">ส่งไปฝ่าย</label>
            <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[#242424] border border-[#333] text-white focus:outline-none focus:border-[#C9922A]">
              {departments.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">วันที่ส่งสำนักงานใหญ่</label>
            <input type="date" value={form.sent_to_hq_date} onChange={e => setForm({ ...form, sent_to_hq_date: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[#242424] border border-[#333] text-white focus:outline-none focus:border-[#C9922A]" />
          </div>
          <input type="number" placeholder="ค่าใช้จ่าย (บาท)" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })}
            className="px-3 py-2 rounded-lg bg-[#242424] border border-[#333] text-white placeholder-gray-500 focus:outline-none focus:border-[#C9922A]" />
          <input placeholder="หมายเหตุ" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
            className="px-3 py-2 rounded-lg bg-[#242424] border border-[#333] text-white placeholder-gray-500 focus:outline-none focus:border-[#C9922A]" />
          <div className="col-span-2">
            <label className="text-xs text-gray-400 mb-1 block">แนบรูปภาพ</label>
            <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)}
              className="text-sm text-gray-400" />
          </div>
          <div className="col-span-2 flex gap-2">
            <button type="submit" disabled={uploading} className="flex-1 py-2 bg-[#C9922A] text-black rounded-lg font-semibold text-sm disabled:opacity-50">
              {uploading ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 bg-[#242424] text-gray-400 rounded-lg text-sm">ยกเลิก</button>
          </div>
        </form>
      )}

      {loading ? <div className="text-gray-400">กำลังโหลด...</div> : (
        <div className="bg-[#1a1a1a] border border-[#C9922A]/20 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#333] text-gray-400">
                <th className="text-left px-4 py-3">ผู้ส่ง</th>
                <th className="text-left px-4 py-3">วันที่รับ</th>
                <th className="text-left px-4 py-3">ฝ่าย</th>
                <th className="text-left px-4 py-3">ส่ง HQ</th>
                <th className="text-left px-4 py-3">ค่าใช้จ่าย</th>
                <th className="text-left px-4 py-3">หมายเหตุ</th>
                <th className="px-4 py-3">รูป</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {docs.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-500">ยังไม่มีข้อมูลเดือนนี้</td></tr>
              ) : docs.map(doc => (
                <tr key={doc.id} className="border-b border-[#242424] hover:bg-[#242424]/50">
                  <td className="px-4 py-3 text-white">{doc.sender_name}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(doc.received_date).toLocaleDateString('th-TH')}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs bg-[#C9922A]/20 text-[#C9922A]">{doc.department}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{doc.sent_to_hq_date ? new Date(doc.sent_to_hq_date).toLocaleDateString('th-TH') : '-'}</td>
                  <td className="px-4 py-3 text-gray-400">{doc.cost ? `${doc.cost.toLocaleString()} บาท` : '-'}</td>
                  <td className="px-4 py-3 text-gray-400">{doc.note || '-'}</td>
                  <td className="px-4 py-3">
                    {doc.image_url ? (
                      <a href={doc.image_url} target="_blank" rel="noreferrer" className="text-[#C9922A] text-xs underline">ดูรูป</a>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(doc.id)} className="text-red-400 hover:text-red-300 text-xs">ลบ</button>
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
