import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'LHVA / AVHL — Appalachian Valley Hockey League',
  description: 'Official site of the Ligue de Hockey Vallée-Appalaches.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-rink-900 text-white antialiased">
        {children}
      </body>
    </html>
  )
}