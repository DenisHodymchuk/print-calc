'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import type { Printer } from './printers-client'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  printer: Printer | null
  onSaved: () => void
}

const EMPTY = {
  brand: '', model: '', purchasePrice: '', powerWatts: '',
  lifetimeHours: '2000', maintenanceReservePerHour: '0', notes: '',
}

export function PrinterDialog({ open, onOpenChange, printer, onSaved }: Props) {
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (printer) {
      const brand = printer.brand || ''
      const model = brand && printer.name.startsWith(brand)
        ? printer.name.slice(brand.length).trim()
        : printer.name
      setForm({
        brand,
        model,
        purchasePrice: String(printer.purchasePrice),
        powerWatts: String(printer.powerWatts),
        lifetimeHours: String(printer.lifetimeHours),
        maintenanceReservePerHour: String(printer.maintenanceReservePerHour),
        notes: printer.notes || '',
      })
    } else {
      setForm(EMPTY)
    }
  }, [printer, open])

  function handle(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.model) { toast.error('Введіть модель принтера'); return }
    setLoading(true)

    const name = [form.brand, form.model].filter(Boolean).join(' ')

    const url = printer ? `/api/printers/${printer.id}` : '/api/printers'
    const method = printer ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, name }),
    })

    setLoading(false)

    if (res.ok) {
      toast.success(printer ? 'Принтер оновлено' : 'Принтер додано')
      onSaved()
      onOpenChange(false)
    } else {
      const data = await res.json()
      toast.error(data.error || 'Помилка збереження')
    }
  }

  // Live preview cost per hour
  const costPerHour = (() => {
    const price = parseFloat(form.purchasePrice) || 0
    const hours = parseFloat(form.lifetimeHours) || 1
    const watts = parseFloat(form.powerWatts) || 0
    const maint = parseFloat(form.maintenanceReservePerHour) || 0
    const elRate = 4.32
    return (price / hours + (watts / 1000) * elRate + maint).toFixed(2)
  })()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{printer ? 'Редагувати принтер' : 'Додати принтер'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Бренд</Label>
              <Input id="brand" name="brand" value={form.brand} onChange={handle} placeholder="Bambu Lab" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Модель *</Label>
              <Input id="model" name="model" value={form.model} onChange={handle} required placeholder="A1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Ціна купівлі (₴) *</Label>
              <Input id="purchasePrice" name="purchasePrice" type="number" min="0" value={form.purchasePrice} onChange={handle} required placeholder="25000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="powerWatts">Потужність (Вт) *</Label>
              <Input id="powerWatts" name="powerWatts" type="number" min="0" value={form.powerWatts} onChange={handle} required placeholder="350" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lifetimeHours">Ресурс (год)</Label>
              <Input id="lifetimeHours" name="lifetimeHours" type="number" min="100" value={form.lifetimeHours} onChange={handle} placeholder="2000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maintenanceReservePerHour">Обслуговування (₴/год)</Label>
              <Input id="maintenanceReservePerHour" name="maintenanceReservePerHour" type="number" min="0" step="0.01" value={form.maintenanceReservePerHour} onChange={handle} placeholder="0.5" />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes">Нотатки</Label>
              <Input id="notes" name="notes" value={form.notes} onChange={handle} placeholder="Будь-яка додаткова інформація..." />
            </div>
          </div>

          {form.purchasePrice && form.powerWatts && (
            <div className="bg-muted rounded-lg p-3 text-sm">
              <span className="text-muted-foreground">Вартість машинного часу: </span>
              <span className="font-semibold text-foreground">{costPerHour} ₴/год</span>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Скасувати</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Збереження...' : printer ? 'Зберегти' : 'Додати'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
