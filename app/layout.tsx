import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
})

export const metadata: Metadata = {
  title: 'Buba Lab 3D — Калькулятор друку',
  description: 'Калькулятор вартості 3D друку для вашого бізнесу',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uk">
      <body className={`${geist.variable} antialiased`}>{children}</body>
    </html>
  )
}
