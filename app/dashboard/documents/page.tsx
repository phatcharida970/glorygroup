'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Doc = {
  id: string
  sender_name: string
  sender_names: string[] | null
  received_date: string
  department: string
  sent_to_hq_date: string | null
  cost: number | null
  note: string | null
  image_urls: string[] | null
  created_at: string
}

type Agent = { id: string; name: string; code: string }

type Entry = {
  sender_name: string
  received_date: string
  department: string
  sent_to_hq_date: string
  note: string
  agentSearch: string
  showAgentList: boolean
  imageFiles: File[]
  cost: string
  payment_method: string
}

const departments = ['ฝ่ายพิจารณา', 'ฝ่ายสินไหม', 'ฝ่ายบริการ']

function toThaiDate(isoDate: string): string {
  const d = new Date(isoDate)
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear() + 543}`
}

function newEntry(): Entry {
  return { sender_name: '', received_date: '', department: departments[0], sent_to_hq_date: '', note: '', agentSearch: '', showAgentList: false, imageFiles: [], cost: '', payment_method: '' }
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [entries, setEntries] = useState<Entry[]>([newEntry()])
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
      .from('gg_documents').select('*')
      .gte('received_date', `${month}-01`)
      .lte('received_date', `${month}-${lastDay}`)
      .order('received_date', { ascending: false })
    if (fetchError) setError('โหลดข้อมูลไม่ได้: ' + fetchError.message)
    setDocs(data || [])
    setLoading(false)
  }

  function updateEntry(i: number, patch: Partial<Entry>) {
    setEntries(entries.map((e, j) => j === i ? { ...e, ...patch } : e))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const valid = entries.filter(e => e.sender_name && e.received_date)
    if (valid.length === 0) { setError('กรุณากรอกข้อมูลอย่างน้อย 1 รายการ'); return }
    setUploading(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()

    const rows = await Promise.all(valid.map(async en => {
      const image_urls: string[] = []
      for (const file of en.imageFiles) {
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
      return {
        sender_name: en.sender_name,
        received_date: en.received_date,
        department: en.department,
        sent_to_hq_date: en.sent_to_hq_date || null,
        note: en.note || null,
        cost: en.cost ? parseFloat(en.cost) : null,
      payment_method: en.payment_method || null,
        image_urls: image_urls.length > 0 ? image_urls : null,
        user_id: user?.id
      }
    }))

    const { error: insertError } = await supabase.from('gg_documents').insert(rows)
    if (insertError) { setError('บันทึกไม่สำเร็จ: ' + insertError.message); setUploading(false); return }
    setEntries([newEntry()]); setShowForm(false); setUploading(false)
    fetchDocs()
  }

  async function handleDelete(id: string) {
    if (!confirm('ยืนยันการลบ?')) return
    await supabase.from('gg_documents').delete().eq('id', id)
    fetchDocs()
  }

  const totalCost = docs.reduce((sum, d) => sum + (d.cost || 0), 0)
  const inputClass = "w-full px-3 py-2 rounded-lg bg-[#242424] border border-[#333] text-white placeholder-gray-500 focus:outline-none focus:border-[#C9922A] text-sm"

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
        <div className="ml-auto text-sm text-gray-400">รวม <span className="text-white font-semibold">{docs.length}</span> รอบ</div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#1a1a1a] border border-[#C9922A]/30 rounded-xl p-5 mb-6">
          <div className="flex flex-col gap-4">
            {entries.map((en, i) => (
              <div key={i} className="bg-[#242424] rounded-xl p-4 border border-[#333] relative">
                {entries.length > 1 && (
                  <button type="button" onClick={() => setEntries(entries.filter((_, j) => j !== i))}
                    className="absolute top-3 right-3 text-red-400 hover:text-red-300 text-xs">ลบ</button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* ผู้ส่ง */}
                  <div className="relative">
                    <label className="text-xs text-gray-400 mb-1 block">ชื่อผู้ส่ง (ตัวแทน)</label>
                    {en.sender_name ? (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#C9922A]/10 border border-[#C9922A]/40">
                        <span className="text-white text-sm flex-1">{en.sender_name}</span>
                        <button type="button" onClick={() => updateEntry(i, { sender_name: '', agentSearch: '' })} className="text-gray-400 hover:text-red-400 text-xs">✕</button>
                      </div>
                    ) : (
                      <>
                        <input placeholder="พิมพ์ชื่อหรือรหัสเพื่อค้นหา..."
                          value={en.agentSearch}
                          onChange={e => updateEntry(i, { agentSearch: e.target.value, showAgentList: true })}
                          onFocus={() => updateEntry(i, { showAgentList: true })}
                          className={inputClass} autoComplete="off" />
                        {en.showAgentList && (
                          <div className="absolute z-50 w-full bg-[#1a1a1a] border border-[#C9922A]/40 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-xl">
                            {agents.filter(a => !en.agentSearch || a.name.includes(en.agentSearch) || (a.code && a.code.includes(en.agentSearch))).length === 0 ? (
                              <div className="px-4 py-3 text-sm text-gray-500">ไม่พบตัวแทน</div>
                            ) : agents.filter(a => !en.agentSearch || a.name.includes(en.agentSearch) || (a.code && a.code.includes(en.agentSearch))).map(a => (
                              <div key={a.id}
                                onMouseDown={() => updateEntry(i, { sender_name: a.code ? `${a.name} (${a.code})` : a.name, agentSearch: '', showAgentList: false })}
                                className="px-4 py-3 text-sm text-white hover:bg-[#C9922A]/20 cursor-pointer border-b border-[#333]">
                                {a.name}{a.code ? <span className="text-gray-400 ml-2">({a.code})</span> : ''}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* ส่งไปฝ่าย */}
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">ส่งไปฝ่าย</label>
                    <select value={en.department} onChange={e => updateEntry(i, { department: e.target.value })} className={inputClass}>
                      {departments.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>

                  {/* วันที่ส่งมาสาขา */}
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">วันที่ส่งมาสาขา</label>
                    <input required type="date" value={en.received_date} onChange={e => updateEntry(i, { received_date: e.target.value })} className={inputClass} />
                    {en.received_date && <p className="text-xs text-[#C9922A] mt-1">พ.ศ. {new Date(en.received_date).getFullYear() + 543}</p>}
                  </div>

                  {/* วันที่ส่ง HQ */}
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">วันที่ส่งสำนักงานใหญ่</label>
                    <input type="date" value={en.sent_to_hq_date} onChange={e => updateEntry(i, { sent_to_hq_date: e.target.value })} className={inputClass} />
                    {en.sent_to_hq_date && <p className="text-xs text-[#C9922A] mt-1">พ.ศ. {new Date(en.sent_to_hq_date).getFullYear() + 543}</p>}
                  </div>

                  {/* หมายเหตุ */}
                  <div className="md:col-span-2">
                    <input placeholder="หมายเหตุ" value={en.note} onChange={e => updateEntry(i, { note: e.target.value })} className={inputClass} />
                  </div>

                  {/* ค่าใช้จ่าย + วิธีชำระ */}
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">ค่าใช้จ่าย (บาท)</label>
                    <input type="number" placeholder="0" value={en.cost}
                      onChange={e => updateEntry(i, { cost: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">วิธีชำระเงิน</label>
                    <select value={en.payment_method} onChange={e => updateEntry(i, { payment_method: e.target.value })} className={inputClass}>
                      <option value="">-- เลือกวิธีชำระ --</option>
                      <option value="เงินสด">เงินสด</option>
                      <option value="เงินโอน">เงินโอน</option>
                      <option value="ตัดบัตร">ตัดบัตร</option>
                    </select>
                  </div>

                  {/* แนบรูปของแต่ละคน */}
                  <div className="md:col-span-2">
                    <label className="text-xs text-gray-400 mb-1 block">แนบรูปภาพ (เลือกได้หลายรูป)</label>
                    <input type="file" accept="image/*" multiple
                      onChange={e => updateEntry(i, { imageFiles: Array.from(e.target.files || []) })}
                      className="text-sm text-gray-400" />
                    {en.imageFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {en.imageFiles.map((f, fi) => <span key={fi} className="text-xs bg-[#1a1a1a] text-gray-300 px-2 py-1 rounded">{f.name}</span>)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* ปุ่มเพิ่มรายการ */}
            <button type="button" onClick={() => setEntries([...entries, newEntry()])}
              className="flex items-center gap-2 justify-center py-3 border-2 border-dashed border-[#C9922A]/40 rounded-xl text-[#C9922A] hover:border-[#C9922A] hover:bg-[#C9922A]/10 transition-colors text-sm">
              <span className="text-xl leading-none">+</span> เพิ่มรายการถัดไป
            </button>
          </div>

          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
          <div className="flex gap-2 mt-4">
            <button type="submit" disabled={uploading} className="flex-1 py-3 bg-[#C9922A] text-black rounded-lg font-semibold text-sm disabled:opacity-50">
              {uploading ? 'กำลังบันทึก...' : `บันทึก ${entries.length > 1 ? `(${entries.length} รายการ)` : ''}`}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEntries([newEntry()]) }}
              className="flex-1 py-3 bg-[#242424] text-gray-400 rounded-lg text-sm">ยกเลิก</button>
          </div>
        </form>
      )}

      {loading ? <div className="text-gray-400">กำลังโหลด...</div> : docs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">ยังไม่มีข้อมูลเดือนนี้</div>
      ) : (
        <>
          <div className="hidden md:block bg-[#1a1a1a] border border-[#C9922A]/20 rounded-xl overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#333] text-gray-400">
                  <th className="text-left px-4 py-3">ผู้ส่ง</th>
                  <th className="text-left px-4 py-3">วันที่รับ</th>
                  <th className="text-left px-4 py-3">ฝ่าย</th>
                  <th className="text-left px-4 py-3">ส่ง HQ</th>
                  <th className="text-left px-4 py-3">ค่าใช้จ่าย</th>
                  <th className="text-left px-4 py-3">วิธีชำระ</th>
                  <th className="text-left px-4 py-3">หมายเหตุ</th>
                  <th className="px-4 py-3">รูป</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {docs.map(doc => (
                  <tr key={doc.id} className="border-b border-[#242424] hover:bg-[#242424]/50">
                    <td className="px-4 py-3 text-white">{doc.sender_name || (doc.sender_names?.join(', ')) || '-'}</td>
                    <td className="px-4 py-3 text-gray-400">{toThaiDate(doc.received_date)}</td>
                    <td className="px-4 py-3"><span className="px-2 py-1 rounded-full text-xs bg-[#C9922A]/20 text-[#C9922A]">{doc.department}</span></td>
                    <td className="px-4 py-3 text-gray-400">{doc.sent_to_hq_date ? toThaiDate(doc.sent_to_hq_date) : '-'}</td>
                    <td className="px-4 py-3 text-gray-400">{doc.cost ? `${doc.cost.toLocaleString()} บาท` : '-'}</td>
                    <td className="px-4 py-3 text-gray-400">{(doc as any).payment_method || '-'}</td>
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

          <div className="md:hidden flex flex-col gap-3 mb-4">
            {docs.map(doc => (
              <div key={doc.id} className="bg-[#1a1a1a] border border-[#C9922A]/20 rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-white font-semibold text-sm">{doc.sender_name || (doc.sender_names?.join(', ')) || '-'}</span>
                  <span className="px-2 py-1 rounded-full text-xs bg-[#C9922A]/20 text-[#C9922A]">{doc.department}</span>
                </div>
                <div className="grid grid-cols-2 gap-y-1 text-sm mb-2">
                  <span className="text-gray-500">วันที่รับ</span><span className="text-gray-300">{toThaiDate(doc.received_date)}</span>
                  <span className="text-gray-500">ส่ง HQ</span><span className="text-gray-300">{doc.sent_to_hq_date ? toThaiDate(doc.sent_to_hq_date) : '-'}</span>
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

          <div className="bg-[#1a1a1a] border border-[#C9922A]/30 rounded-xl p-5">
            <h3 className="text-[#C9922A] font-semibold mb-3">สรุปค่าใช้จ่ายประจำเดือน</h3>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">จำนวนรอบที่ส่ง</span>
              <span className="text-white font-semibold">{docs.length} รอบ</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-gray-400 text-sm">ค่าใช้จ่ายรวม</span>
              <span className="text-[#C9922A] font-bold text-lg">{totalCost.toLocaleString()} บาท</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
