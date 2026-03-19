'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Zap, Clock, Wrench, CircleDollarSign, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PrinterDialog } from './printer-dialog'

export type Printer = {
  id: string
  name: string
  brand: string | null
  purchasePrice: number
  powerWatts: number
  lifetimeHours: number
  maintenanceReservePerHour: number
  notes: string | null
}

export function PrintersClient() {
  const [printers, setPrinters] = useState<Printer[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editPrinter, setEditPrinter] = useState<Printer | null>(null)
  const [search, setSearch] = useState('')
  // Ціна кВт·год береться з профілю — тимчасово 4.32 ₴
  const electricityRate = 4.32

  const fetchPrinters = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/printers')
    const data = await res.json()
    setPrinters(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchPrinters() }, [fetchPrinters])

  function calcCostPerHour(p: Printer) {
    const depreciation = p.purchasePrice / p.lifetimeHours
    const electricity = (p.powerWatts / 1000) * electricityRate
    return depreciation + electricity + p.maintenanceReservePerHour
  }

  // ROI: скільки годин треба надрукувати щоб окупити принтер
  // (при середній ціні продажу 2× собівартості)
  function calcRoiHours(p: Printer) {
    const costPerHour = calcCostPerHour(p)
    if (costPerHour === 0) return 0
    return Math.round(p.purchasePrice / costPerHour)
  }

  async function handleDelete(id: string) {
    if (!confirm('Видалити принтер?')) return
    const res = await fetch(`/api/printers/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Принтер видалено')
      fetchPrinters()
    } else {
      toast.error('Помилка видалення')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div className="flex gap-3 flex-wrap flex-1 items-center">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Пошук за брендом, моделлю..."
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Ціна електроенергії: <span className="font-medium">{electricityRate} ₴/кВт·год</span>
            <span className="ml-2 text-xs">(Налаштування)</span>
          </p>
        </div>
        <Button onClick={() => { setEditPrinter(null); setDialogOpen(true) }} className="gap-2">
          <Plus className="w-4 h-4" /> Додати принтер
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Завантаження...</p>
      ) : printers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg mb-2">Принтерів не додано</p>
          <p className="text-sm">Додайте свій перший принтер щоб розраховувати вартість машинного часу</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {printers.filter(p => {
            if (!search) return true
            const q = search.toLowerCase()
            return p.name.toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q)
          }).map((p) => {
            const costPerHour = calcCostPerHour(p)
            const roiHours = calcRoiHours(p)
            return (
              <Card key={p.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{p.name}</CardTitle>
                      {p.brand && <p className="text-sm text-muted-foreground">{p.brand}</p>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-7 w-7"
                        onClick={() => { setEditPrinter(p); setDialogOpen(true) }}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 hover:text-destructive"
                        onClick={() => handleDelete(p.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <div>
                        <p className="text-muted-foreground text-xs">Потужність</p>
                        <p className="font-medium">{p.powerWatts} Вт</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="text-muted-foreground text-xs">Ресурс</p>
                        <p className="font-medium">{p.lifetimeHours.toLocaleString()} год</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-orange-500" />
                      <div>
                        <p className="text-muted-foreground text-xs">Обслуговування</p>
                        <p className="font-medium">{p.maintenanceReservePerHour.toFixed(2)} ₴/год</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CircleDollarSign className="w-4 h-4 text-green-500" />
                      <div>
                        <p className="text-muted-foreground text-xs">Вартість часу</p>
                        <p className="font-semibold text-base">{costPerHour.toFixed(2)} ₴/год</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1 border-t border-border">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Ціна принтера</span>
                      <span className="font-medium text-foreground">{p.purchasePrice.toLocaleString()} ₴</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Годин друку до окупності</span>
                      <span className="font-medium text-foreground">{roiHours.toLocaleString()} год</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <PrinterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        printer={editPrinter}
        onSaved={fetchPrinters}
      />
    </div>
  )
}
