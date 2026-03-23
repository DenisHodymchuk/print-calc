'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Trash2, ExternalLink, Copy, Clock, FileText, Printer, Pencil, ChevronDown, BookOpen, ImagePlus, X } from 'lucide-react'
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
  modelId: string | null
  quoteToken: string | null
  createdAt: string
  amsMaterials: string | null
  material: { name: string; type: string; colorHex: string | null } | null
  printer: { name: string } | null
}

type AmsMaterialEntry = { materialId: string; weightGrams: number; name?: string; colorHex?: string }

function parseAmsMaterials(raw: string | null): AmsMaterialEntry[] {
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [] }
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Чернетка', QUOTED: 'Кошторис', APPROVED: 'Підтверджено',
  PRINTING: 'Друкується', DONE: 'Готово', CANCELLED: 'Скасовано',
}

const STATUS_COLORS: Record<string, 'secondary' | 'default' | 'outline' | 'destructive'> = {
  DRAFT: 'secondary', QUOTED: 'outline', APPROVED: 'default',
  PRINTING: 'default', DONE: 'secondary', CANCELLED: 'destructive',
}

const STATUS_ORDER = ['DRAFT', 'QUOTED', 'APPROVED', 'PRINTING', 'DONE', 'CANCELLED']

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

type ModelOption = { id: string; name: string; category: string; photoUrl: string | null }

function ModelPickerDialog({ onSelect, onClose }: { onSelect: (modelId: string) => void; onClose: () => void }) {
  const [models, setModels] = useState<ModelOption[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newPhoto, setNewPhoto] = useState('')
  const [saving, setSaving] = useState(false)

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX = 800
        let w = img.width, h = img.height
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h * MAX / w); w = MAX }
          else { w = Math.round(w * MAX / h); h = MAX }
        }
        canvas.width = w; canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        setNewPhoto(canvas.toDataURL('image/jpeg', 0.7))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    fetch('/api/library').then(r => r.json()).then(d => { setModels(d); setLoading(false) })
  }, [])

  async function handleCreate() {
    if (!newName.trim() || !newCategory.trim()) { toast.error('Введіть назву та категорію'); return }
    setSaving(true)
    const res = await fetch('/api/library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', name: newName.trim(), category: newCategory.trim(), photoUrl: newPhoto || null }),
    })
    setSaving(false)
    if (res.ok) {
      const model = await res.json()
      onSelect(model.id)
    } else {
      toast.error('Помилка створення')
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5 space-y-3" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-base">Додати до моделі</h3>

        {creating ? (
          <div className="space-y-3">
            <Input placeholder="Назва моделі" value={newName} onChange={e => setNewName(e.target.value)} />
            <Input placeholder="Категорія (Брелоки, Вази...)" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
            {newPhoto ? (
              <div className="relative inline-block">
                <img src={newPhoto} alt="" className="h-20 rounded-lg border object-cover" />
                <button onClick={() => setNewPhoto('')}
                  className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground border border-dashed border-input rounded-lg px-3 py-2 hover:bg-accent/50 transition-colors">
                <ImagePlus className="w-4 h-4" /> Додати фото
                <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              </label>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCreating(false)} className="flex-1">Назад</Button>
              <Button onClick={handleCreate} disabled={saving} className="flex-1">
                {saving ? 'Створення...' : 'Створити'}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {loading ? <p className="text-sm text-muted-foreground">Завантаження...</p> : (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {models.map(m => (
                  <button key={m.id} onClick={() => onSelect(m.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent text-left transition-colors">
                    {m.photoUrl ? (
                      <img src={m.photoUrl} alt="" className="w-10 h-10 rounded-xl object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.category}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <Button variant="outline" onClick={() => setCreating(true)} className="w-full gap-2">
              <Plus className="w-4 h-4" /> Створити нову модель
            </Button>
            <Button variant="ghost" onClick={onClose} className="w-full text-muted-foreground">Скасувати</Button>
          </>
        )}
      </div>
    </div>
  )
}

export function CalculationsClient() {
  const router = useRouter()
  const [calculations, setCalculations] = useState<Calculation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [linkCalcId, setLinkCalcId] = useState<string | null>(null)

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

  async function handleLinkToModel(calcId: string, modelId: string) {
    const res = await fetch('/api/library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'link', calculationId: calcId, modelId }),
    })
    if (res.ok) { toast.success('Додано до моделі'); fetchCalculations() }
    setLinkCalcId(null)
  }

  async function handleUnlinkFromModel(calcId: string) {
    const res = await fetch('/api/library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'unlink', calculationId: calcId }),
    })
    if (res.ok) { toast.success('Відв\'язано від моделі'); fetchCalculations() }
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
                  {/* Photo or color dot(s) */}
                  {c.photoUrl ? (
                    <img src={c.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-border flex-shrink-0" />
                  ) : (() => {
                    const ams = parseAmsMaterials(c.amsMaterials)
                    const amsWithColor = ams.filter(a => a.colorHex)
                    if (amsWithColor.length > 0) {
                      return (
                        <div className="flex -space-x-2 flex-shrink-0">
                          {amsWithColor.slice(0, 4).map((a, i) => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-background"
                              style={{ backgroundColor: a.colorHex || '#ccc' }}
                              title={a.name || ''} />
                          ))}
                        </div>
                      )
                    }
                    if (c.material?.colorHex) {
                      return <div className="w-10 h-10 rounded-full border-2 border-border flex-shrink-0"
                        style={{ backgroundColor: c.material.colorHex }} />
                    }
                    return null
                  })()}

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold truncate">{c.name}</p>
                      <StatusDropdown status={c.status} onChangeStatus={(s) => handleStatusChange(c.id, s)} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                      {(() => {
                        const ams = parseAmsMaterials(c.amsMaterials)
                        if (ams.length > 0) {
                          const names = ams.map(a => a.name).filter(Boolean)
                          return <span>AMS: {names.length > 0 ? names.join(', ') : `${ams.length} матеріал(ів)`}</span>
                        }
                        if (c.material) {
                          return <span>{c.material.name} · {c.material.type}</span>
                        }
                        return null
                      })()}
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
                      size="icon" variant="ghost" className={`h-8 w-8 ${c.modelId ? 'text-primary' : ''}`}
                      title={c.modelId ? 'Відв\'язати від моделі' : 'Додати до моделі'}
                      onClick={() => c.modelId ? handleUnlinkFromModel(c.id) : setLinkCalcId(c.id)}
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

      {linkCalcId && (
        <ModelPickerDialog
          onSelect={(modelId) => handleLinkToModel(linkCalcId, modelId)}
          onClose={() => setLinkCalcId(null)}
        />
      )}
    </div>
  )
}
