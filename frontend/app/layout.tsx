import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Alibaba Supplier Finder',
  description: 'Find and compare suppliers from Alibaba with ease',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white">{children}</body>
    </html>
  )
}