'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Printer } from 'lucide-react'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

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

  async function handleGoogle() {
    setGoogleLoading(true)
    await signIn('google', { callbackUrl: '/dashboard' })
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

          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full h-11 flex items-center justify-center gap-3 border border-[#ddddd5] rounded-lg text-sm font-medium hover:bg-[#f5f5f0] transition-colors disabled:opacity-60 mb-4"
          >
            <GoogleIcon />
            {googleLoading ? 'Перенаправлення...' : 'Увійти через Google'}
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[#ddddd5]" />
            <span className="text-xs text-muted-foreground">або</span>
            <div className="flex-1 h-px bg-[#ddddd5]" />
          </div>

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
