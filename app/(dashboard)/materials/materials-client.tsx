'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { MaterialDialog } from './material-dialog'

export type Material = {
  id: string
  name: string
  brand: string | null
  color: string | null
  colorHex: string | null
  type: string
  pricePerKg: number
  density: number
  failureRate: number
  notes: string | null
}

const MATERIAL_TYPES = ['PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'NYLON', 'RESIN', 'OTHER']

const TYPE_LABELS: Record<string, string> = {
  PLA: 'PLA', PETG: 'PETG', ABS: 'ABS', ASA: 'ASA',
  TPU: 'TPU', NYLON: 'Нейлон', RESIN: 'Смола', OTHER: 'Інше',
}

export function MaterialsClient() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editMaterial, setEditMaterial] = useState<Material | null>(null)

  const fetchMaterials = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterType && filterType !== 'all') params.set('type', filterType)
    const res = await fetch(`/api/materials?${params}`)
    const data = await res.json()
    setMaterials(data)
    setLoading(false)
  }, [filterType])

  useEffect(() => { fetchMaterials() }, [fetchMaterials])

  const filtered = materials.filter((m) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      m.name.toLowerCase().includes(q) ||
      (m.brand || '').toLowerCase().includes(q) ||
      (m.color || '').toLowerCase().includes(q)
    )
  })

  async function handleDelete(id: string) {
    if (!confirm('Видалити матеріал?')) return
    const res = await fetch(`/api/materials/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Матеріал видалено')
      fetchMaterials()
    } else {
      toast.error('Помилка видалення')
    }
  }

  function handleEdit(m: Material) {
    setEditMaterial(m)
    setDialogOpen(true)
  }

  function handleAdd() {
    setEditMaterial(null)
    setDialogOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3 flex-wrap flex-1">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Пошук за назвою, брендом, кольором..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
          >
            <option value="all">Всі типи</option>
            {MATERIAL_TYPES.map(t => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" /> Додати філамент
        </Button>
      </div>

      {/* Cards */}
      {loading ? (
        <p className="text-muted-foreground">Завантаження...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg mb-2">Філаментів не знайдено</p>
          <p className="text-sm">Додайте перший філамент за допомогою кнопки вище</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((m) => (
            <Card key={m.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {m.colorHex && (
                      <div
                        className="w-8 h-8 rounded-full border flex-shrink-0"
                        style={{ backgroundColor: m.colorHex }}
                        title={m.color || ''}
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{m.name}</p>
                      {m.brand && <p className="text-xs text-muted-foreground truncate">{m.brand}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(m)}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 hover:text-destructive" onClick={() => handleDelete(m.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">{TYPE_LABELS[m.type] || m.type}</Badge>
                  {m.color && <Badge variant="outline">{m.color}</Badge>}
                </div>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ціна</span>
                    <span className="font-medium">{m.pricePerKg.toFixed(0)} ₴/кг</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Відходи</span>
                    <span>{(m.failureRate * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <MaterialDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        material={editMaterial}
        onSaved={fetchMaterials}
      />
    </div>
  )
}
