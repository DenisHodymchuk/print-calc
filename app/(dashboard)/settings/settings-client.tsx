'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Crown } from 'lucide-react'
import Link from 'next/link'

type UserSettings = {
  email: string
  name: string | null
  businessName: string | null
  hourlyRate: number
  electricityRate: number
  isPremium: boolean
  premiumUntil: string | null
}

export function SettingsClient() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [form, setForm] = useState({
    name: '', businessName: '', hourlyRate: '', electricityRate: '',
    currentPassword: '', newPassword: '', confirmPassword: '',
  })
  const [saving, setSaving] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then((data: UserSettings) => {
        setSettings(data)
        setForm(prev => ({
          ...prev,
          name: data.name || '',
          businessName: data.businessName || '',
          hourlyRate: String(data.hourlyRate),
          electricityRate: String(data.electricityRate),
        }))
      })
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        businessName: form.businessName,
        hourlyRate: form.hourlyRate,
        electricityRate: form.electricityRate,
      }),
    })
    setSaving(false)
    if (res.ok) {
      toast.success('Налаштування збережено')
    } else {
      const data = await res.json()
      toast.error(data.error || 'Помилка збереження')
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (form.newPassword !== form.confirmPassword) {
      toast.error('Паролі не співпадають')
      return
    }
    if (form.newPassword.length < 6) {
      toast.error('Пароль має бути не менше 6 символів')
      return
    }
    setSavingPassword(true)
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      }),
    })
    setSavingPassword(false)
    if (res.ok) {
      toast.success('Пароль змінено')
      setForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))
    } else {
      const data = await res.json()
      toast.error(data.error || 'Помилка зміни пароля')
    }
  }

  if (!settings) return <div className="p-6 text-muted-foreground">Завантаження...</div>

  return (
    <div className="p-6 max-w-2xl space-y-6">
      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Профіль</CardTitle>
          <CardDescription>Ім&apos;я, назва бізнесу та email</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={settings.email} disabled className="bg-muted" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Ім&apos;я</Label>
                <Input id="name" name="name" value={form.name} onChange={handleChange} placeholder="Іван Іваненко" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessName">Назва бізнесу</Label>
                <Input id="businessName" name="businessName" value={form.businessName} onChange={handleChange} placeholder="3D Print Studio" />
              </div>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? 'Збереження...' : 'Зберегти'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className={`w-5 h-5 ${settings?.isPremium ? 'text-amber-500' : 'text-muted-foreground'}`} />
              <div>
                <p className="font-medium text-sm">
                  {settings?.isPremium ? 'Premium активний' : 'Безкоштовний план'}
                </p>
                {settings?.isPremium && settings.premiumUntil ? (
                  <p className="text-xs text-muted-foreground">
                    Діє до {new Date(settings.premiumUntil).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {' '}({Math.max(0, Math.ceil((new Date(settings.premiumUntil).getTime() - Date.now()) / 86400000))} днів)
                  </p>
                ) : settings?.isPremium ? (
                  <p className="text-xs text-muted-foreground">Безстроковий доступ</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Обмежений функціонал</p>
                )}
              </div>
            </div>
            {!settings?.isPremium && (
              <Link href="/pricing" className="text-xs bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity">
                Отримати PRO
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Financial settings */}
      <Card>
        <CardHeader>
          <CardTitle>Фінансові налаштування</CardTitle>
          <CardDescription>Ставки для розрахунку вартості</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="electricityRate">Ціна електроенергії (₴/кВт·год)</Label>
                <Input
                  id="electricityRate" name="electricityRate" type="number" min="0" step="0.01"
                  value={form.electricityRate} onChange={handleChange}
                  placeholder="4.32"
                />
                <p className="text-xs text-muted-foreground">Використовується для розрахунку вартості машинного часу</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Ваша ставка праці (₴/год)</Label>
                <Input
                  id="hourlyRate" name="hourlyRate" type="number" min="0" step="1"
                  value={form.hourlyRate} onChange={handleChange}
                  placeholder="150"
                />
                <p className="text-xs text-muted-foreground">Ваша погодинна ставка для підготовки та постобробки</p>
              </div>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? 'Збереження...' : 'Зберегти налаштування'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle>Зміна пароля</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Поточний пароль</Label>
              <Input id="currentPassword" name="currentPassword" type="password" value={form.currentPassword} onChange={handleChange} />
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Новий пароль</Label>
                <Input id="newPassword" name="newPassword" type="password" value={form.newPassword} onChange={handleChange} placeholder="Мін. 6 символів" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Підтвердити пароль</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} />
              </div>
            </div>
            <Button type="submit" variant="outline" disabled={savingPassword}>
              {savingPassword ? 'Збереження...' : 'Змінити пароль'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
