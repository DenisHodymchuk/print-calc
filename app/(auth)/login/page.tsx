'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Printer } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (result?.error) {
      setError('Невірний email або пароль')
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-[#EEEEE8] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] flex items-center justify-center">
            <Printer className="w-5 h-5 text-primary" />
          </div>
          <span className="font-black text-xl tracking-tight">
            3D Print <span className="text-primary">UA</span>
          </span>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#ddddd5]">
          <h1 className="text-2xl font-black mb-1">Вхід</h1>
          <p className="text-muted-foreground text-sm mb-6">Увійдіть у свій кабінет</p>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required autoComplete="email"
                className="bg-[#f5f5f0] border-[#ddddd5] h-11" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Пароль</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
                required autoComplete="current-password"
                className="bg-[#f5f5f0] border-[#ddddd5] h-11" />
            </div>
            <Button type="submit" className="w-full h-11 font-bold bg-[#1a1a1a] hover:bg-[#333] text-white" disabled={loading}>
              {loading ? 'Вхід...' : 'Увійти'}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-6">
            Немає акаунту?{' '}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              Зареєструватись
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
