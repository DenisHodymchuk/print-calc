'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Crown, Shield, UserIcon } from 'lucide-react'

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

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    const res = await fetch(`/api/admin/users?${params}`)
    if (res.ok) {
      const data = await res.json()
      setUsers(data)
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Пошук за email..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Badge variant="outline" className="text-sm px-3">
          {users.length} користувач(ів)
        </Badge>
      </div>

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
