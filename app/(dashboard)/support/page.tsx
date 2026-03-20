'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Header } from '@/components/layout/header'
import { Send, Shield } from 'lucide-react'

type Message = {
  id: string
  message: string
  fromAdmin: boolean
  createdAt: string
}

export default function SupportPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchMessages = useCallback(async () => {
    const res = await fetch('/api/support')
    if (res.ok) setMessages(await res.json())
  }, [])

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [fetchMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!text.trim()) return
    setSending(true)
    const res = await fetch('/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text.trim() }),
    })
    setSending(false)
    if (res.ok) {
      setText('')
      fetchMessages()
    } else {
      toast.error('Помилка надсилання')
    }
  }

  function formatTime(date: string) {
    return new Date(date).toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      <Header title="Чат" accent="підтримки" subtitle="Напишіть нам і ми відповімо якнайшвидше" />
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-card border rounded-xl overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-12">
                <p>Поки що повідомлень немає</p>
                <p className="text-xs mt-1">Напишіть ваше питання нижче</p>
              </div>
            )}
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.fromAdmin ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  m.fromAdmin
                    ? 'bg-muted text-foreground rounded-bl-md'
                    : 'bg-primary text-white rounded-br-md'
                }`}>
                  {m.fromAdmin && (
                    <div className="flex items-center gap-1 mb-0.5">
                      <Shield className="w-3 h-3 text-primary" />
                      <span className="text-[10px] font-medium text-primary">Адміністратор</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                  <p className={`text-[10px] mt-1 ${m.fromAdmin ? 'text-muted-foreground' : 'text-white/60'}`}>
                    {formatTime(m.createdAt)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t p-3 flex gap-2">
            <Input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Напишіть повідомлення..."
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={sending || !text.trim()} size="icon" className="flex-shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
