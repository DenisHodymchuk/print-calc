'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Crown, Shield, UserIcon, Sparkles } from 'lucide-react'

type UserInfo = {
  id: string
  email: string
  name: string | null
  role: string
  isPremium: boolean
  premiumUntil: string | null
  businessName: string | null
  createdAt: string
  _count: { calculations: number; printers: number; materials: number }
}

export function AdminClient() {
  const [users, setUsers] = useState<UserInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [promoEnabled, setPromoEnabled] = useState(false)
  const [promoDays, setPromoDays] = useState(30)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    const res = await fetch(`/api/admin/users?${params}`)
    if (res.ok) {
      const data = await res.json()
      setUsers(data.users)
      setPromoEnabled(data.promo.enabled)
      if (data.promo.days) setPromoDays(data.promo.days)
    }
    setLoading(false)
  }, [search])

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300)
    return () => clearTimeout(t)
  }, [fetchUsers])

  async function togglePremium(userId: string, isPremium: boolean) {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isPremium: !isPremium }),
    })
    if (res.ok) {
      toast.success(isPremium ? 'Преміум деактивовано' : 'Преміум активовано')
      fetchUsers()
    } else {
      toast.error('Помилка')
    }
  }

  async function toggleAdmin(userId: string, role: string) {
    const newRole = role === 'ADMIN' ? 'USER' : 'ADMIN'
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: newRole }),
    })
    if (res.ok) {
      toast.success(`Роль змінено: ${newRole}`)
      fetchUsers()
    } else {
      toast.error('Помилка')
    }
  }

  async function togglePromo() {
    const newState = !promoEnabled
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'togglePromo', enabled: newState, days: promoDays }),
    })
    if (res.ok) {
      setPromoEnabled(newState)
      toast.success(newState ? `Промо увімкнено — нові акаунти отримають PRO на ${promoDays} днів` : 'Промо вимкнено')
    } else {
      toast.error('Помилка')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Пошук за email..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Badge variant="outline" className="text-sm px-3">
          {users.length} користувач(ів)
        </Badge>
      </div>

      {/* Promo toggle */}
      <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${promoEnabled ? 'bg-green-50 border-green-200' : 'bg-muted/30 border-input'}`}>
        <Crown className={`w-5 h-5 flex-shrink-0 ${promoEnabled ? 'text-green-600' : 'text-muted-foreground'}`} />
        <div className="flex-1">
          <p className="text-sm font-medium">{promoEnabled ? 'Промо-акція активна' : 'Промо-акція вимкнена'}</p>
          <p className="text-xs text-muted-foreground">
            {promoEnabled ? `Нові акаунти отримують PRO на ${promoDays} днів` : 'Нові акаунти реєструються без PRO'}
          </p>
        </div>
        <Input
          type="number" min="1" max="365" value={promoDays}
          onChange={e => setPromoDays(parseInt(e.target.value) || 30)}
          className="w-16 text-center text-sm"
          disabled={promoEnabled}
        />
        <span className="text-xs text-muted-foreground">днів</span>
        <Button size="sm" variant={promoEnabled ? 'destructive' : 'default'} className="gap-1.5 text-xs" onClick={togglePromo}>
          {promoEnabled ? 'Вимкнути' : 'Увімкнути'}
        </Button>
      </div>

      {/* New users (last 3 days) */}
      {!loading && (() => {
        const threeDaysAgo = new Date()
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
        const newUsers = users.filter(u => new Date(u.createdAt) >= threeDaysAgo)
        if (newUsers.length === 0) return null
        return (
          <div className="rounded-lg border border-green-200 bg-green-50/50 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-green-800">Нові користувачі</span>
              <Badge variant="secondary" className="text-xs">{newUsers.length}</Badge>
            </div>
            <div className="flex flex-wrap gap-3">
              {newUsers.map(u => (
                <div key={u.id} className="flex items-center gap-2 bg-white rounded-md border px-3 py-2 text-sm">
                  <UserIcon className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <span className="font-medium">{u.name || u.email}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {new Date(u.createdAt).toLocaleDateString('uk-UA')}
                    </span>
                  </div>
                  {u.isPremium && (
                    <span className="inline-flex items-center gap-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      <Crown className="w-2.5 h-2.5" />PRO
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {loading ? (
        <p className="text-muted-foreground">Завантаження...</p>
      ) : (
        <div className="space-y-3">
          {users.map(u => (
            <Card key={u.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-5 h-5 text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{u.name || u.email}</p>
                      {u.role === 'ADMIN' && (
                        <Badge variant="destructive" className="text-[10px] gap-0.5">
                          <Shield className="w-2.5 h-2.5" /> Адмін
                        </Badge>
                      )}
                      {u.isPremium && (
                        <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <Crown className="w-2.5 h-2.5" /> PRO
                          {u.premiumUntil && <span className="opacity-75">до {new Date(u.premiumUntil).toLocaleDateString('uk-UA')}</span>}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>{u.email}</span>
                      {u.businessName && <span>· {u.businessName}</span>}
                      <span>· {new Date(u.createdAt).toLocaleDateString('uk-UA')}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>{u._count.calculations} розрахунків</span>
                      <span>{u._count.printers} принтерів</span>
                      <span>{u._count.materials} філаментів</span>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant={u.isPremium ? 'outline' : 'default'}
                      className="gap-1 text-xs"
                      onClick={() => togglePremium(u.id, u.isPremium)}
                    >
                      <Crown className="w-3 h-3" />
                      {u.isPremium ? 'Забрати PRO' : 'Дати PRO'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 text-xs"
                      onClick={() => toggleAdmin(u.id, u.role)}
                    >
                      <Shield className="w-3 h-3" />
                      {u.role === 'ADMIN' ? 'Зняти адмін' : 'Зробити адмін'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
