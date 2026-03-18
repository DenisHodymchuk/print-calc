'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import type { Material } from './materials-client'

const MATERIAL_TYPES = ['PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'NYLON', 'RESIN', 'OTHER']
const TYPE_LABELS: Record<string, string> = {
  PLA: 'PLA', PETG: 'PETG', ABS: 'ABS', ASA: 'ASA',
  TPU: 'TPU', NYLON: 'Нейлон', RESIN: 'Смола', OTHER: 'Інше',
}

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  material: Material | null
  onSaved: () => void
}

const EMPTY = {
  brand: '', color: '', colorHex: '#ffffff',
  type: 'PLA', pricePerKg: '', density: '1.24', failureRate: '5', notes: '',
}

export function MaterialDialog({ open, onOpenChange, material, onSaved }: Props) {
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (material) {
      setForm({
        brand: material.brand || '',
        color: material.color || '',
        colorHex: material.colorHex || '#ffffff',
        type: material.type,
        pricePerKg: String(material.pricePerKg),
        density: String(material.density),
        failureRate: String(material.failureRate * 100),
        notes: material.notes || '',
      })
    } else {
      setForm(EMPTY)
    }
  }, [material, open])

  function handle(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function buildName() {
    const parts = [form.brand, TYPE_LABELS[form.type] || form.type, form.color].filter(Boolean)
    return parts.join(' ')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const payload = {
      name: buildName() || TYPE_LABELS[form.type] || form.type,
      brand: form.brand,
      color: form.color,
      colorHex: form.colorHex,
      type: form.type,
      pricePerKg: parseFloat(form.pricePerKg),
      density: parseFloat(form.density),
      failureRate: parseFloat(form.failureRate) / 100,
      notes: form.notes,
    }

    const url = material ? `/api/materials/${material.id}` : '/api/materials'
    const method = material ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setLoading(false)

    if (res.ok) {
      toast.success(material ? 'Філамент оновлено' : 'Філамент додано')
      onSaved()
      onOpenChange(false)
    } else {
      const data = await res.json()
      toast.error(data.error || 'Помилка збереження')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{material ? 'Редагувати філамент' : 'Додати філамент'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Бренд</Label>
              <Input id="brand" name="brand" value={form.brand} onChange={handle} placeholder="Bambu Lab" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Тип</Label>
              <select
                id="type"
                name="type"
                value={form.type}
                onChange={handle}
                className="w-full h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
              >
                {MATERIAL_TYPES.map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Колір (назва)</Label>
              <Input id="color" name="color" value={form.color} onChange={handle} placeholder="Білий" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="colorHex">Колір (візуально)</Label>
              <div className="flex gap-2">
                <Input
                  id="colorHex"
                  name="colorHex"
                  type="color"
                  value={form.colorHex}
                  onChange={handle}
                  className="w-12 h-9 p-1 cursor-pointer"
                />
                <Input
                  name="colorHex"
                  value={form.colorHex}
                  onChange={handle}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pricePerKg">Ціна (₴/кг) *</Label>
              <Input id="pricePerKg" name="pricePerKg" type="number" min="0" step="0.01" value={form.pricePerKg} onChange={handle} required placeholder="350" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="failureRate">Відходи (%)</Label>
              <Input id="failureRate" name="failureRate" type="number" min="0" max="100" step="1" value={form.failureRate} onChange={handle} placeholder="5" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="density">Щільність (г/см³)</Label>
              <Input id="density" name="density" type="number" min="0.5" step="0.01" value={form.density} onChange={handle} placeholder="1.24" />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes">Нотатки</Label>
              <Input id="notes" name="notes" value={form.notes} onChange={handle} placeholder="Додаткова інформація..." />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Скасувати</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Збереження...' : material ? 'Зберегти' : 'Додати'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
