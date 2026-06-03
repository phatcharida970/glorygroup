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
  image_urls: string[] | null
  created_at: string
}

type Agent = {
  id: string
  name: string
  code: string
}

const departments = ['ฝ่ายพิจารณา', 'ฝ่ายสินไหม', 'ฝ่ายบริการ']

function toThaiDate(isoDate: string): string {
  const d = new Date(isoDate)
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear() + 543}`
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    sender_name: '', received_date: '', department: departments[0],
    sent_to_hq_date: '', cost: '', note: ''
  })
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [error, setError] = useState('')
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const supabase = createClient()

  useEffect(() => { fetchDocs(); fetchAgents() }, [month])

  async function fetchAgents() {
    const { data } = await supabase.from('gg_agents').select('id, name, code').order('name')
    setAgents(data || [])
  }

  async function fetchDocs() {
    setLoading(true)
    const [y, m] = month.split('-')
    const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate()
    const { data, error: fetchError } = await supabase
      .from('gg_documents')
      .select('*')
      .gte('received_date', `${month}-01`)
      .lte('received_date', `${month}-${lastDay}`)
      .order('received_date', { ascending: false })
    if (fetchError) setError('โหลดข้อมูลไม่ได้: ' + fetchError.message)
    setDocs(data || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setUploading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()

    const image_urls: string[] = []
    for (const file of imageFiles) {
      try {
        const ext = file.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadError } = await supabase.storage.from('attachments').upload(fileName, file, { upsert: true })
        if (!uploadError) {
          const { data } = supabase.storage.from('attachments').getPublicUrl(fileName)
          image_urls.push(data.publicUrl)
        }
      } catch {}
    }

    const { error: insertError } = await supabase.from('gg_documents').insert([{
      ...form,
      cost: form.cost ? parseFloat(form.cost) : null,
      sent_to_hq_date: form.sent_to_hq_date || null,
      image_urls: image_urls.length > 0 ? image_urls : null,
      user_id: user?.id
    }])
    if (insertError) {
      setError('บันทึกไม่สำเร็จ: ' + insertError.message)
      setUploading(false)
      return
    }
    setForm({ sender_name: '', received_date: '', department: departments[0], sent_to_hq_date: '', cost: '', note: '' })
    setImageFiles([])
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
  const inputClass = "px-3 py-2 rounded-lg bg-[#242424] border border-[#333] text-white placeholder-gray-500 focus:outline-none focus:border-[#C9922A]"

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#C9922A]">ฝากส่งเอกสาร</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[#C9922A] hover:bg-[#E8B84B] text-black rounded-lg font-semibold text-sm transition-colors">
          + เพิ่มรายการ
        </button>
      </div>

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
          <div>
            <label className="text-xs text-gray-400 mb-1 block">ชื่อผู้ส่ง (ตัวแทน)</label>
            <select required value={form.sender_name} onChange={e => setForm({ ...form, sender_name: e.target.value })}
              className={`w-full ${inputClass}`}>
              <option value="">-- เลือกตัวแทน --</option>
              {agents.map(a => (
                <option key={a.id} value={a.name}>{a.name}{a.code ? ` (${a.code})` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">วันที่ส่งมาสาขา</label>
            <input required type="date" value={form.received_date} onChange={e => setForm({ ...form, received_date: e.target.value })}
              className={`w-full ${inputClass}`} />
            {form.received_date && <p className="text-xs text-[#C9922A] mt-1">พ.ศ. {new Date(form.received_date).getFullYear() + 543}</p>}
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">ส่งไปฝ่าย</label>
            <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className={`w-full ${inputClass}`}>
              {departments.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">วันที่ส่งสำนักงานใหญ่</label>
            <input type="date" value={form.sent_to_hq_date} onChange={e => setForm({ ...form, sent_to_hq_date: e.target.value })}
              className={`w-full ${inputClass}`} />
            {form.sent_to_hq_date && <p className="text-xs text-[#C9922A] mt-1">พ.ศ. {new Date(form.sent_to_hq_date).getFullYear() + 543}</p>}
          </div>
          <input type="number" placeholder="ค่าใช้จ่าย (บาท)" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} className={inputClass} />
          <input placeholder="หมายเหตุ" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className={inputClass} />
          <div className="col-span-2">
            <label className="text-xs text-gray-400 mb-1 block">แนบรูปภาพ (เลือกได้หลายรูป)</label>
            <input type="file" accept="image/*" multiple
              onChange={e => setImageFiles(Array.from(e.target.files || []))}
              className="text-sm text-gray-400" />
            {imageFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {imageFiles.map((f, i) => (
                  <span key={i} className="text-xs bg-[#242424] text-gray-300 px-2 py-1 rounded">{f.name}</span>
                ))}
              </div>
            )}
          </div>
          {error && <p className="col-span-2 text-red-400 text-sm">{error}</p>}
          <div className="col-span-2 flex gap-2">
            <button type="submit" disabled={uploading} className="flex-1 py-2 bg-[#C9922A] text-black rounded-lg font-semibold text-sm disabled:opacity-50">
              {uploading ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 bg-[#242424] text-gray-400 rounded-lg text-sm">ยกเลิก</button>
          </div>
        </form>
      )}

      {loading ? <div className="text-gray-400">กำลังโหลด...</div> : docs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">ยังไม่มีข้อมูลเดือนนี้</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-[#1a1a1a] border border-[#C9922A]/20 rounded-xl overflow-hidden">
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
                {docs.map(doc => (
                  <tr key={doc.id} className="border-b border-[#242424] hover:bg-[#242424]/50">
                    <td className="px-4 py-3 text-white">{doc.sender_name}</td>
                    <td className="px-4 py-3 text-gray-400">{toThaiDate(doc.received_date)}</td>
                    <td className="px-4 py-3"><span className="px-2 py-1 rounded-full text-xs bg-[#C9922A]/20 text-[#C9922A]">{doc.department}</span></td>
                    <td className="px-4 py-3 text-gray-400">{doc.sent_to_hq_date ? toThaiDate(doc.sent_to_hq_date) : '-'}</td>
                    <td className="px-4 py-3 text-gray-400">{doc.cost ? `${doc.cost.toLocaleString()} บาท` : '-'}</td>
                    <td className="px-4 py-3 text-gray-400">{doc.note || '-'}</td>
                    <td className="px-4 py-3">
                      {doc.image_urls?.length ? doc.image_urls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer" className="text-[#C9922A] text-xs underline block">รูป {i + 1}</a>
                      )) : '-'}
                    </td>
                    <td className="px-4 py-3"><button onClick={() => handleDelete(doc.id)} className="text-red-400 text-xs">ลบ</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden flex flex-col gap-3">
            {docs.map(doc => (
              <div key={doc.id} className="bg-[#1a1a1a] border border-[#C9922A]/20 rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-white font-semibold">{doc.sender_name}</span>
                  <span className="px-2 py-1 rounded-full text-xs bg-[#C9922A]/20 text-[#C9922A]">{doc.department}</span>
                </div>
                <div className="grid grid-cols-2 gap-y-1 text-sm mb-2">
                  <span className="text-gray-500">วันที่รับ</span><span className="text-gray-300">{toThaiDate(doc.received_date)}</span>
                  <span className="text-gray-500">ส่ง HQ</span><span className="text-gray-300">{doc.sent_to_hq_date ? toThaiDate(doc.sent_to_hq_date) : '-'}</span>
                  <span className="text-gray-500">ค่าใช้จ่าย</span><span className="text-gray-300">{doc.cost ? `${doc.cost.toLocaleString()} บาท` : '-'}</span>
                  <span className="text-gray-500">หมายเหตุ</span><span className="text-gray-300">{doc.note || '-'}</span>
                </div>
                {doc.image_urls?.length ? (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {doc.image_urls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer" className="text-[#C9922A] text-xs underline">รูป {i + 1}</a>
                    ))}
                  </div>
                ) : null}
                <button onClick={() => handleDelete(doc.id)} className="text-red-400 text-xs">ลบ</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
