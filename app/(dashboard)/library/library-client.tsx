'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Trash2, FolderOpen, ChevronDown, Tag, Pencil, X, ImagePlus, Save, Package, ArrowLeft, Calculator } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

type ModelCard = {
  id: string
  name: string
  category: string
  photoUrl: string | null
  notes: string | null
  _count: { calculations: number }
}

type Variant = {
  id: string
  name: string
  weightGrams: number
  printTimeMinutes: number
  materialCost: number
  machineCost: number
  laborCost: number
  overheadCost: number
  totalCost: number
  sellingPrice: number
  marginPercent: number
  copies: number
  infillPercent: number
  layerHeight: number
  hasSupports: boolean
  photoUrl: string | null
  createdAt: string
  material: { name: string; type: string; colorHex: string | null; color: string | null } | null
  printer: { name: string } | null
}

type ModelDetail = ModelCard & { calculations: Variant[] }

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

  return (
    <div className="relative">
      <button ref={btnRef} onClick={() => setOpen(o => !o)}
        className="h-8 rounded-lg border border-input bg-transparent px-3 py-0 text-sm flex items-center gap-1.5 hover:bg-accent transition-colors">
        <Tag className="w-3.5 h-3.5 text-muted-foreground" />
        <span>{value === 'all' ? 'Всі категорії' : value}</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />
      </button>
      {open && (
        <div ref={popupRef} className="absolute top-full left-0 mt-1 z-50 rounded-lg border border-input bg-white shadow-lg overflow-hidden min-w-[160px]">
          <button onClick={() => { onChange('all'); setOpen(false) }}
            className={`w-full px-3 py-2 text-sm text-left hover:bg-accent ${value === 'all' ? 'bg-accent font-medium' : ''}`}>
            Всі категорії
          </button>
          {categories.map(c => (
            <button key={c} onClick={() => { onChange(c); setOpen(false) }}
              className={`w-full px-3 py-2 text-sm text-left hover:bg-accent ${c === value ? 'bg-accent font-medium' : ''}`}>
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ModelFormDialog({ model, onClose, onSaved }: { model?: ModelCard | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: model?.name || '',
    category: model?.category || '',
    notes: model?.notes || '',
    photoUrl: model?.photoUrl || '',
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
    const res = await fetch('/api/library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: model ? 'update' : 'create',
        ...(model ? { modelId: model.id } : {}),
        name: form.name,
        category: form.category,
        notes: form.notes,
        photoUrl: form.photoUrl || null,
      }),
    })
    setSaving(false)
    if (res.ok) { toast.success(model ? 'Збережено' : 'Модель створено'); onSaved(); onClose() }
    else toast.error('Помилка')
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">{model ? 'Редагувати модель' : 'Нова модель'}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Назва *</Label>
            <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Дракон, Ваза..." />
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
                <img src={form.photoUrl} alt="" className="w-32 h-32 rounded-2xl border-2 border-border object-cover" />
                <button onClick={() => setForm(p => ({ ...p, photoUrl: '' }))}
                  className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground border border-dashed border-input rounded-lg px-4 py-3 hover:bg-accent/50 transition-colors">
                <ImagePlus className="w-4 h-4" /> Завантажити фото
                <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              </label>
            )}
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Скасувати</Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 gap-2">
            <Save className="w-4 h-4" /> {saving ? 'Збереження...' : 'Зберегти'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Model detail view — shows variants
function ModelDetailView({ modelId, onBack }: { modelId: string; onBack: () => void }) {
  const router = useRouter()
  const [model, setModel] = useState<ModelDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/library/${modelId}`).then(r => r.json()).then(d => { setModel(d); setLoading(false) })
  }, [modelId])

  async function handleUnlink(calcId: string) {
    const res = await fetch('/api/library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'unlink', calculationId: calcId }),
    })
    if (res.ok) {
      toast.success('Варіант відв\'язано')
      fetch(`/api/library/${modelId}`).then(r => r.json()).then(setModel)
    }
  }

  function formatTime(minutes: number) {
    const h = Math.floor(minutes / 60)
    const m = Math.round(minutes % 60)
    return h > 0 ? `${h}г ${m}хв` : `${m}хв`
  }

  if (loading) return <p className="p-6 text-muted-foreground">Завантаження...</p>
  if (!model) return <p className="p-6 text-muted-foreground">Модель не знайдена</p>

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex items-center gap-4 flex-1">
          {model.photoUrl ? (
            <img src={model.photoUrl} alt="" className="w-16 h-16 rounded-2xl object-cover border" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <Package className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <div>
            <h2 className="font-bold text-xl">{model.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">{model.category}</Badge>
              <span className="text-sm text-muted-foreground">{model.calculations.length} варіант(ів)</span>
            </div>
          </div>
        </div>
        <Button onClick={() => router.push(`/calculator?modelId=${model.id}`)} className="gap-2">
          <Plus className="w-4 h-4" /> Новий розрахунок
        </Button>
      </div>

      {/* Variants */}
      {model.calculations.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calculator className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg mb-2">Варіантів ще немає</p>
          <p className="text-sm">Додайте розрахунок до цієї моделі з калькулятора або розрахунків</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {model.calculations.map(v => (
            <Card key={v.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                {/* Header: photo + material + printer */}
                <div className="flex items-center gap-2">
                  {v.photoUrl ? (
                    <img src={v.photoUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  ) : v.material?.colorHex ? (
                    <div className="w-6 h-6 rounded-full border flex-shrink-0" style={{ backgroundColor: v.material.colorHex }} />
                  ) : null}
                  <div className="flex-1 min-w-0">
                    {v.material && <p className="font-medium text-sm truncate">{v.material.name}</p>}
                    {v.printer && <p className="text-xs text-muted-foreground">{v.printer.name}</p>}
                  </div>
                </div>

                {/* Parameters */}
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div><p className="text-muted-foreground">Вага</p><p className="font-medium">{v.weightGrams}г</p></div>
                  <div><p className="text-muted-foreground">Час</p><p className="font-medium">{formatTime(v.printTimeMinutes)}</p></div>
                  <div><p className="text-muted-foreground">Шар</p><p className="font-medium">{v.layerHeight}мм</p></div>
                  <div><p className="text-muted-foreground">Заповн.</p><p className="font-medium">{v.infillPercent}%</p></div>
                </div>

                {/* Costs */}
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div><p className="text-muted-foreground">Матеріал</p><p className="font-medium">{v.materialCost.toFixed(1)} ₴</p></div>
                  <div><p className="text-muted-foreground">Аморт.</p><p className="font-medium">{v.machineCost.toFixed(1)} ₴</p></div>
                  <div><p className="text-muted-foreground">Підгот.</p><p className="font-medium">{v.laborCost.toFixed(1)} ₴</p></div>
                  <div><p className="text-muted-foreground">Наклад.</p><p className="font-medium">{v.overheadCost.toFixed(1)} ₴</p></div>
                </div>

                {/* Price + actions */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Собівартість: {v.totalCost.toFixed(0)} ₴ · маржа {v.marginPercent}%</p>
                    <p className="font-bold text-lg">{v.sellingPrice.toFixed(0)} ₴</p>
                  </div>
                  <div className="flex gap-0.5">
                    <Button size="icon" variant="ghost" className="h-7 w-7" title="Новий розрахунок" onClick={() => router.push(`/calculator?from=${v.id}&modelId=${model.id}`)}>
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" title="Редагувати" onClick={() => router.push(`/calculator?edit=${v.id}`)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 hover:text-destructive" title="Відв'язати" onClick={() => handleUnlink(v.id)}>
                      <X className="w-3.5 h-3.5" />
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

export function LibraryClient() {
  const [models, setModels] = useState<ModelCard[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editModel, setEditModel] = useState<ModelCard | null>(null)
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)

  const fetchModels = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterCategory !== 'all') params.set('category', filterCategory)
    if (search) params.set('search', search)
    const res = await fetch(`/api/library?${params}`)
    const data = await res.json()
    setModels(data)
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
    const t = setTimeout(fetchModels, 300)
    return () => clearTimeout(t)
  }, [fetchModels])

  async function handleDelete(id: string) {
    if (!confirm('Видалити модель з бібліотеки?')) return
    const res = await fetch('/api/library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', modelId: id }),
    })
    if (res.ok) { toast.success('Модель видалено'); fetchModels(); fetchCategories() }
  }

  function handleSaved() { fetchModels(); fetchCategories() }

  // Show detail view
  if (selectedModelId) {
    return <ModelDetailView modelId={selectedModelId} onBack={() => setSelectedModelId(null)} />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3 flex-wrap flex-1">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Пошук моделі..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <CategoryDropdown value={filterCategory} onChange={setFilterCategory} categories={categories} />
        </div>
        <Button onClick={() => { setEditModel(null); setShowForm(true) }} className="gap-2">
          <Plus className="w-4 h-4" /> Нова модель
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Завантаження...</p>
      ) : models.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg mb-2">Бібліотека порожня</p>
          <p className="text-sm mb-4">Створіть першу модель і додайте до неї розрахунки</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {models.map(m => (
            <Card key={m.id} className="group hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedModelId(m.id)}>
              <CardContent className="p-4 flex items-center gap-4">
                {m.photoUrl ? (
                  <img src={m.photoUrl} alt={m.name} className="w-24 h-24 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                    <Package className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-lg truncate">{m.name}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="outline">{m.category}</Badge>
                    <span className="text-sm text-muted-foreground">{m._count.calculations} варіант(ів)</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditModel(m); setShowForm(true) }}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-destructive" onClick={() => handleDelete(m.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <ModelFormDialog model={editModel} onClose={() => setShowForm(false)} onSaved={handleSaved} />
      )}
    </div>
  )
}
