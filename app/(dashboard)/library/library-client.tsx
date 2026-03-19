'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Trash2, Calculator, FolderOpen, ChevronDown, Tag } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

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

export function LibraryClient() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')

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

  return (
    <div className="p-6 space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3 flex-wrap flex-1">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Пошук моделі..."
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {categories.length > 0 && (
            <CategoryDropdown value={filterCategory} onChange={setFilterCategory} categories={categories} />
          )}
        </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {templates.map(t => (
            <Card key={t.id} className="group hover:shadow-md transition-shadow overflow-hidden">
              {/* Photo */}
              {t.photoUrl ? (
                <div className="h-40 overflow-hidden">
                  <img src={t.photoUrl} alt={t.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center" style={{ backgroundColor: t.material?.colorHex || '#e5e5e0' }}>
                  <Calculator className="w-10 h-10 text-white/60" />
                </div>
              )}

              <CardContent className="p-4 space-y-3">
                <div>
                  <p className="font-semibold truncate">{t.name}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {t.category && (
                      <Badge variant="outline" className="text-xs">{t.category}</Badge>
                    )}
                    {t.material && (
                      <span className="text-xs text-muted-foreground">{t.material.name}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  {t.printer && <span>🖨 {t.printer.name}</span>}
                  <span>⏱ {formatTime(t.printTimeMinutes)}</span>
                  <span>⚖ {t.weightGrams}г</span>
                  <span className="font-medium text-foreground">{t.sellingPrice.toFixed(0)} ₴</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={() => router.push(`/calculator?from=${t.id}`)}
                  >
                    <Plus className="w-3.5 h-3.5" /> Розрахунок
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="hover:text-destructive"
                    onClick={() => handleRemove(t.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
