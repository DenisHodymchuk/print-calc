'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Printer } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    businessName: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Помилка реєстрації')
    } else {
      router.push('/login?registered=true')
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
          <h1 className="text-2xl font-black mb-1">Реєстрація</h1>
          <p className="text-muted-foreground text-sm mb-6">Створіть свій акаунт</p>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ім&apos;я</Label>
              <Input
                id="name"
                name="name"
                placeholder="Іван Іваненко"
                value={formData.name}
                onChange={handleChange}
                className="bg-[#f5f5f0] border-[#ddddd5] h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="businessName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Назва бізнесу</Label>
              <Input
                id="businessName"
                name="businessName"
                placeholder="3D Print Studio"
                value={formData.businessName}
                onChange={handleChange}
                className="bg-[#f5f5f0] border-[#ddddd5] h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                className="bg-[#f5f5f0] border-[#ddddd5] h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Пароль</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Мінімум 6 символів"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
                className="bg-[#f5f5f0] border-[#ddddd5] h-11"
              />
            </div>
            <Button type="submit" className="w-full h-11 font-bold bg-[#1a1a1a] hover:bg-[#333] text-white" disabled={loading}>
              {loading ? 'Реєстрація...' : 'Зареєструватись'}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-6">
            Вже є акаунт?{' '}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Увійти
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
