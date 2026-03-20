'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/layout/header'
import { Send, ArrowLeft, MessageSquare } from 'lucide-react'
import { usePremium } from '@/lib/use-premium'
import { useRouter } from 'next/navigation'

type Conversation = {
  userId: string
  name: string | null
  email: string
  lastMessage: string
  lastAt: string
  unread: number
}

type Message = {
  id: string
  message: string
  fromAdmin: boolean
  createdAt: string
}

export default function AdminSupportPage() {
  const { isAdmin } = usePremium()
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isAdmin === false) router.replace('/dashboard')
  }, [isAdmin, router])

  const fetchConversations = useCallback(async () => {
    const res = await fetch('/api/support')
    if (res.ok) setConversations(await res.json())
  }, [])

  const fetchMessages = useCallback(async () => {
    if (!selectedUserId) return
    const res = await fetch(`/api/support?userId=${selectedUserId}`)
    if (res.ok) setMessages(await res.json())
  }, [selectedUserId])

  useEffect(() => { fetchConversations() }, [fetchConversations])

  useEffect(() => {
    if (!selectedUserId) return
    fetchMessages()
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [selectedUserId, fetchMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!text.trim() || !selectedUserId) return
    setSending(true)
    const res = await fetch('/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text.trim(), userId: selectedUserId }),
    })
    setSending(false)
    if (res.ok) {
      setText('')
      fetchMessages()
      fetchConversations()
    } else {
      toast.error('Помилка')
    }
  }

  function formatTime(date: string) {
    return new Date(date).toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  if (!isAdmin) return null

  return (
    <>
      <Header title="Чати" accent="підтримки" subtitle="Повідомлення від користувачів" />
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-card border rounded-xl overflow-hidden flex" style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}>
          {/* Conversations list */}
          <div className={`w-72 border-r flex-shrink-0 overflow-y-auto ${selectedUserId ? 'hidden md:block' : ''}`}>
            {conversations.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-12">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>Повідомлень немає</p>
              </div>
            ) : conversations.map(c => (
              <button
                key={c.userId}
                onClick={() => setSelectedUserId(c.userId)}
                className={`w-full text-left p-3 border-b hover:bg-accent/50 transition-colors ${selectedUserId === c.userId ? 'bg-accent' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm truncate">{c.name || c.email}</p>
                  {c.unread > 0 && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0 ml-1">{c.unread}</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{c.lastMessage}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{formatTime(c.lastAt)}</p>
              </button>
            ))}
          </div>

          {/* Chat */}
          <div className={`flex-1 flex flex-col ${!selectedUserId ? 'hidden md:flex' : 'flex'}`}>
            {selectedUserId ? (
              <>
                {/* Chat header */}
                <div className="border-b px-4 py-2.5 flex items-center gap-2">
                  <button onClick={() => setSelectedUserId(null)} className="md:hidden">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <p className="font-medium text-sm">
                    {conversations.find(c => c.userId === selectedUserId)?.name || conversations.find(c => c.userId === selectedUserId)?.email}
                  </p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map(m => (
                    <div key={m.id} className={`flex ${m.fromAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                        m.fromAdmin
                          ? 'bg-primary text-white rounded-br-md'
                          : 'bg-muted text-foreground rounded-bl-md'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                        <p className={`text-[10px] mt-1 ${m.fromAdmin ? 'text-white/60' : 'text-muted-foreground'}`}>
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
                    placeholder="Відповідь..."
                    className="flex-1"
                  />
                  <Button onClick={handleSend} disabled={sending || !text.trim()} size="icon">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                Оберіть розмову зліва
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
