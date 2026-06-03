export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[#C9922A] mb-6">ภาพรวม</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1a1a1a] border border-[#C9922A]/20 rounded-xl p-6">
          <div className="text-3xl mb-2">👤</div>
          <h2 className="text-lg font-semibold text-white">ตัวแทน</h2>
          <p className="text-gray-400 text-sm mt-1">จัดการและติดตามวันหมดอายุใบอนุญาต</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#C9922A]/20 rounded-xl p-6">
          <div className="text-3xl mb-2">📄</div>
          <h2 className="text-lg font-semibold text-white">ฝากส่งเอกสาร</h2>
          <p className="text-gray-400 text-sm mt-1">บันทึกการส่งเอกสารรายวัน</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#C9922A]/20 rounded-xl p-6">
          <div className="text-3xl mb-2">💰</div>
          <h2 className="text-lg font-semibold text-white">บัญชีรายจ่าย</h2>
          <p className="text-gray-400 text-sm mt-1">สรุปรายจ่ายบริษัทและเงินเดือนพนักงาน</p>
        </div>
      </div>
    </div>
  )
}
