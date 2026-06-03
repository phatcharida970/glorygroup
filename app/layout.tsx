import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Glorygroup",
  description: "ระบบจัดการหลังบ้าน Glorygroup",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-[#0f0f0f] text-[#f5f5f5]">{children}</body>
    </html>
  )
}
