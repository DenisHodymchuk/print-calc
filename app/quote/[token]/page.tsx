import { notFound } from 'next/navigation'
import { QuoteClient } from './quote-client'

async function getQuote(token: string) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/quote/${token}`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

export default async function QuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const quote = await getQuote(token)
  if (!quote) notFound()
  return <QuoteClient quote={quote} token={token} />
}
