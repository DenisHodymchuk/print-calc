'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Trash2, FolderOpen, ChevronDown, Tag, Pencil, X, ImagePlus, Save, Package } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Printer, Clock } from 'lucide-react'

type Template = {
  id: string
  name: string
  category: string | null
  photoUrl: string | null
  weightGrams: number
  printTimeMinutes: number
  copies: number
  sellingPrice: number
  totalCost: number
  notes: string | null
  createdAt: string
  updatedAt: string
  material: { name: string; type: string; colorHex: string | null; color: string | null } | null
  printer: { name: string } | null
}

function CategoryDropdown({ value, onChange, categories }: { value: string; onChange: (v: string) => void; categories: string[] }) {
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

  const label = value === 'all' ? 'Всі категорії' : value

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen(o => !o)}
        className="h-8 rounded-lg border border-input bg-transparent px-3 py-0 text-sm flex items-center gap-1.5 hover:bg-accent transition-colors"
      >
        <Tag className="w-3.5 h-3.5 text-muted-foreground" />
        <span>{label}</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />
      </button>
      {open && (
        <div
          ref={popupRef}
          className="absolute top-full left-0 mt-1 z-50 rounded-lg border border-input bg-white shadow-lg overflow-hidden min-w-[160px]"
        >
          <button
            onClick={() => { onChange('all'); setOpen(false) }}
            className={`w-full px-3 py-2 text-sm text-left hover:bg-accent ${value === 'all' ? 'bg-accent font-medium' : ''}`}
          >
            Всі категорії
          </button>
          {categories.map(c => (
            <button
              key={c}
              onClick={() => { onChange(c); setOpen(false) }}
              className={`w-full px-3 py-2 text-sm text-left hover:bg-accent ${c === value ? 'bg-accent font-medium' : ''}`}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function EditDialog({ template, onClose, onSaved }: { template: Template; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: template.name,
    category: template.category || '',
    notes: template.notes || '',
    photoUrl: template.photoUrl || '',
  })
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
        setForm(prev => ({ ...prev, photoUrl: canvas.toDataURL('image/jpeg', 0.7) }))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Введіть назву'); return }
    if (!form.category.trim()) { toast.error('Введіть категорію'); return }
    setSaving(true)
    const res = await fetch(`/api/calculations/${template.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        category: form.category,
        notes: form.notes,
        photoUrl: form.photoUrl || null,
      }),
    })
    setSaving(false)
    if (res.ok) {
      toast.success('Збережено')
      onSaved()
      onClose()
    } else {
      toast.error('Помилка збереження')
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Редагувати модель</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Назва *</Label>
            <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Категорія *</Label>
            <Input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="Брелоки, Вази, Іграшки..." />
          </div>
          <div className="space-y-1.5">
            <Label>Нотатки</Label>
            <Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Додаткова інформація..." />
          </div>
          <div className="space-y-1.5">
            <Label>Фото</Label>
            {form.photoUrl ? (
              <div className="relative inline-block">
                <img src={form.photoUrl} alt="Фото" className="w-32 h-32 rounded-2xl border-2 border-border object-cover" />
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, photoUrl: '' }))}
                  className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground border border-dashed border-input rounded-lg px-4 py-3 hover:bg-accent/50 transition-colors">
                <ImagePlus className="w-4 h-4" />
                Завантажити фото
                <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              </label>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Скасувати</Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Збереження...' : 'Зберегти'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function LibraryClient() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [editTemplate, setEditTemplate] = useState<Template | null>(null)

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterCategory !== 'all') params.set('category', filterCategory)
    if (search) params.set('search', search)
    const res = await fetch(`/api/library?${params}`)
    const data = await res.json()
    setTemplates(data)
    setLoading(false)
  }, [filterCategory, search])

  const fetchCategories = useCallback(async () => {
    const res = await fetch('/api/library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'categories' }),
    })
    const data = await res.json()
    setCategories(data)
  }, [])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  useEffect(() => {
    const t = setTimeout(fetchTemplates, 300)
    return () => clearTimeout(t)
  }, [fetchTemplates])

  async function handleRemove(id: string) {
    if (!confirm('Видалити з бібліотеки?')) return
    const res = await fetch('/api/library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove', calculationId: id }),
    })
    if (res.ok) {
      toast.success('Видалено з бібліотеки')
      fetchTemplates()
      fetchCategories()
    }
  }

  function formatTime(minutes: number) {
    const h = Math.floor(minutes / 60)
    const m = Math.round(minutes % 60)
    return h > 0 ? `${h}г ${m}хв` : `${m}хв`
  }

  function handleSaved() {
    fetchTemplates()
    fetchCategories()
  }

  return (
    <div className="p-6 space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Пошук моделі..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <CategoryDropdown value={filterCategory} onChange={setFilterCategory} categories={categories} />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Завантаження...</p>
      ) : templates.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg mb-2">Бібліотека порожня</p>
          <p className="text-sm mb-4">Збережіть модель з розрахунків щоб вона з&apos;явилась тут</p>
          <Button onClick={() => router.push('/calculations')} variant="outline" className="gap-2">
            Перейти до розрахунків
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => (
            <Card key={t.id} className="group hover:shadow-md transition-shadow overflow-hidden">
              <CardContent className="p-0">
                <div className="flex">
                  {/* Photo left */}
                  {t.photoUrl ? (
                    <div className="flex-shrink-0 p-3">
                      <img src={t.photoUrl} alt={t.name} className="w-28 h-28 object-cover rounded-2xl" />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 p-3">
                      <div className="w-28 h-28 rounded-2xl flex items-center justify-center" style={{ backgroundColor: t.material?.colorHex || '#e5e5e0' }}>
                        <Package className="w-8 h-8 text-white/50" />
                      </div>
                    </div>
                  )}

                  {/* Content right */}
                  <div className="flex-1 p-3 flex flex-col justify-between gap-1.5">
                    {/* Title + category */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-sm leading-tight">{t.name}</p>
                        {t.category && <Badge variant="outline" className="text-[10px] flex-shrink-0">{t.category}</Badge>}
                      </div>
                      {t.material && (
                        <p className="text-xs text-muted-foreground mt-0.5">{t.material.name}</p>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      {t.printer && (
                        <span className="flex items-center gap-1">
                          <Printer className="w-3 h-3" /> {t.printer.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatTime(t.printTimeMinutes)}
                      </span>
                      <span>{t.weightGrams}г</span>
                    </div>

                    {/* Price + actions */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-sm">{t.sellingPrice.toFixed(0)} ₴</span>
                        <span className="text-[10px] text-muted-foreground ml-1">собівартість: {t.totalCost.toFixed(0)} ₴</span>
                      </div>
                      <div className="flex gap-0.5">
                        <Button size="icon" variant="ghost" className="h-6 w-6" title="Редагувати" onClick={() => setEditTemplate(t)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6" title="Новий розрахунок" onClick={() => router.push(`/calculator?from=${t.id}`)}>
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 hover:text-destructive" title="Видалити" onClick={() => handleRemove(t.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editTemplate && (
        <EditDialog template={editTemplate} onClose={() => setEditTemplate(null)} onSaved={handleSaved} />
      )}
    </div>
  )
}
