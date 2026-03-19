'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Trash2, ExternalLink, Copy, Clock, FileText, Printer, Pencil, ChevronDown, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

type Calculation = {
  id: string
  name: string
  status: string
  totalCost: number
  sellingPrice: number
  marginPercent: number
  discountPercent: number
  copies: number
  weightGrams: number
  printTimeMinutes: number
  clientName: string | null
  photoUrl: string | null
  isTemplate: boolean
  quoteToken: string | null
  createdAt: string
  material: { name: string; type: string; colorHex: string | null } | null
  printer: { name: string } | null
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Чернетка', QUOTED: 'Кошторис', APPROVED: 'Підтверджено',
  PRINTING: 'Друкується', DONE: 'Готово',
}

const STATUS_COLORS: Record<string, 'secondary' | 'default' | 'outline' | 'destructive'> = {
  DRAFT: 'secondary', QUOTED: 'outline', APPROVED: 'default',
  PRINTING: 'default', DONE: 'secondary',
}

const STATUS_ORDER = ['DRAFT', 'QUOTED', 'APPROVED', 'PRINTING', 'DONE']

function StatusDropdown({ status, onChangeStatus }: { status: string; onChangeStatus: (s: string) => void }) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX })
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      const t = e.target as Node
      if (btnRef.current?.contains(t) || popupRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  return (
    <div className="inline-flex">
      <button
        ref={btnRef}
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 cursor-pointer"
      >
        <Badge variant={STATUS_COLORS[status] || 'secondary'} className="text-xs">
          {STATUS_LABELS[status] || status}
        </Badge>
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </button>
      {open && (
        <div
          ref={popupRef}
          className="fixed z-[200] rounded-lg border border-input bg-white shadow-lg overflow-hidden min-w-[140px]"
          style={{ top: pos.top, left: pos.left }}
        >
          {STATUS_ORDER.map(s => (
            <button
              key={s}
              onClick={() => { onChangeStatus(s); setOpen(false) }}
              className={`w-full px-3 py-2 text-sm text-left hover:bg-accent flex items-center gap-2 ${s === status ? 'bg-accent font-medium' : ''}`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function FilterDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      const t = e.target as Node
      if (btnRef.current?.contains(t) || popupRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  const label = value === 'all' ? 'Всі статуси' : STATUS_LABELS[value] || value

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen(o => !o)}
        className="h-8 rounded-lg border border-input bg-transparent px-3 py-0 text-sm flex items-center gap-1.5 hover:bg-accent transition-colors"
      >
        <span>{label}</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto" />
      </button>
      {open && (
        <div
          ref={popupRef}
          className="absolute top-full left-0 mt-1 z-50 rounded-lg border border-input bg-white shadow-lg overflow-hidden min-w-[140px]"
        >
          <button
            onClick={() => { onChange('all'); setOpen(false) }}
            className={`w-full px-3 py-2 text-sm text-left hover:bg-accent ${value === 'all' ? 'bg-accent font-medium' : ''}`}
          >
            Всі статуси
          </button>
          {STATUS_ORDER.map(s => (
            <button
              key={s}
              onClick={() => { onChange(s); setOpen(false) }}
              className={`w-full px-3 py-2 text-sm text-left hover:bg-accent ${s === value ? 'bg-accent font-medium' : ''}`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function CalculationsClient() {
  const router = useRouter()
  const [calculations, setCalculations] = useState<Calculation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const fetchCalculations = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterStatus !== 'all') params.set('status', filterStatus)
    if (search) params.set('search', search)
    const res = await fetch(`/api/calculations?${params}`)
    const data = await res.json()
    setCalculations(data)
    setLoading(false)
  }, [filterStatus, search])

  useEffect(() => {
    const t = setTimeout(fetchCalculations, 300)
    return () => clearTimeout(t)
  }, [fetchCalculations])

  async function handleDelete(id: string) {
    if (!confirm('Видалити розрахунок?')) return
    const res = await fetch(`/api/calculations/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Розрахунок видалено')
      fetchCalculations()
    } else {
      toast.error('Помилка видалення')
    }
  }

  async function handleStatusChange(id: string, status: string) {
    const res = await fetch(`/api/calculations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      toast.success(`Статус змінено: ${STATUS_LABELS[status]}`)
      fetchCalculations()
    } else {
      toast.error('Помилка зміни статусу')
    }
  }

  async function handleToggleLibrary(id: string, isTemplate: boolean) {
    const category = isTemplate ? null : prompt('Категорія (необов\'язково):')
    const res = await fetch('/api/library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: isTemplate ? 'remove' : 'add',
        calculationId: id,
        category: category || null,
      }),
    })
    if (res.ok) {
      toast.success(isTemplate ? 'Видалено з бібліотеки' : 'Додано до бібліотеки')
      fetchCalculations()
    }
  }

  function copyQuoteLink(token: string) {
    const url = `${window.location.origin}/quote/${token}`
    navigator.clipboard.writeText(url)
    toast.success('Посилання скопійовано!')
  }

  function formatTime(minutes: number) {
    const h = Math.floor(minutes / 60)
    const m = Math.round(minutes % 60)
    return h > 0 ? `${h}г ${m}хв` : `${m}хв`
  }

  return (
    <div className="p-6 space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3 flex-wrap flex-1">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Пошук за назвою..."
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <FilterDropdown value={filterStatus} onChange={setFilterStatus} />
        </div>
        <Button onClick={() => router.push('/calculator')} className="gap-2">
          <Plus className="w-4 h-4" /> Новий розрахунок
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Завантаження...</p>
      ) : calculations.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg mb-2">Розрахунків ще немає</p>
          <p className="text-sm mb-4">Створіть перший розрахунок вартості друку</p>
          <Button onClick={() => router.push('/calculator')} className="gap-2">
            <Plus className="w-4 h-4" /> Новий розрахунок
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {calculations.map(c => (
            <Card key={c.id} className="group hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Photo or color dot */}
                  {c.photoUrl ? (
                    <img src={c.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-border flex-shrink-0" />
                  ) : c.material?.colorHex ? (
                    <div className="w-10 h-10 rounded-full border-2 border-border flex-shrink-0"
                      style={{ backgroundColor: c.material.colorHex }} />
                  ) : null}

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold truncate">{c.name}</p>
                      <StatusDropdown status={c.status} onChangeStatus={(s) => handleStatusChange(c.id, s)} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                      {c.material && (
                        <span>{c.material.name} · {c.material.type}</span>
                      )}
                      {c.printer && (
                        <span className="flex items-center gap-1">
                          <Printer className="w-3 h-3" />{c.printer.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />{formatTime(c.printTimeMinutes)}
                      </span>
                      <span>{c.weightGrams}г</span>
                      {c.clientName && <span>{c.clientName}</span>}
                      <span>{new Date(c.createdAt).toLocaleDateString('uk-UA')}</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-lg">{c.sellingPrice.toFixed(2)} ₴</p>
                    <p className="text-xs text-muted-foreground">
                      Собівартість: {c.totalCost.toFixed(2)} ₴
                    </p>
                    {c.copies > 1 && (
                      <p className="text-xs text-muted-foreground">{c.copies} шт</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="icon" variant="ghost" className="h-8 w-8"
                      title="Редагувати"
                      onClick={() => router.push(`/calculator?edit=${c.id}`)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon" variant="ghost" className={`h-8 w-8 ${c.isTemplate ? 'text-primary' : ''}`}
                      title={c.isTemplate ? 'Видалити з бібліотеки' : 'Зберегти в бібліотеку'}
                      onClick={() => handleToggleLibrary(c.id, c.isTemplate)}
                    >
                      <BookOpen className="w-4 h-4" />
                    </Button>
                    {c.quoteToken && (
                      <Button
                        size="icon" variant="ghost" className="h-8 w-8"
                        title="Скопіювати посилання для клієнта"
                        onClick={() => copyQuoteLink(c.quoteToken!)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    )}
                    {c.quoteToken && (
                      <Button
                        size="icon" variant="ghost" className="h-8 w-8"
                        title="Відкрити кошторис"
                        onClick={() => window.open(`/quote/${c.quoteToken}`, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="icon" variant="ghost" className="h-8 w-8 hover:text-destructive"
                      onClick={() => handleDelete(c.id)}
                    >
                      <Trash2 className="w-4 h-4" />
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
