'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Plus, Trash2, Save, ChevronDown, ChevronUp } from 'lucide-react'
import { calculateCosts, calculateSellingPrice } from '@/lib/cost-calculator'

type Material = { id: string; name: string; brand: string | null; type: string; color: string | null; colorHex: string | null; pricePerKg: number; density: number; failureRate: number }
type Printer = { id: string; name: string; brand: string | null; purchasePrice: number; powerWatts: number; lifetimeHours: number; maintenanceReservePerHour: number }
type PostStep = { name: string; timeMinutes: number; materialCost: number }

function useDropdownPos(open: boolean) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })
  useEffect(() => {
    if (open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX, width: r.width })
    }
  }, [open])
  return { btnRef, popupRef, pos }
}

function PrinterSelect({ printers, value, onChange }: { printers: Printer[]; value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const { btnRef, popupRef, pos } = useDropdownPos(open)
  const selected = printers.find(p => p.id === value)

  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      const t = e.target as Node
      if (btnRef.current?.contains(t) || popupRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open, btnRef, popupRef])

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm text-left flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
      >
        {selected ? <span className="truncate">{selected.name}</span> : <span className="text-muted-foreground">Оберіть принтер</span>}
        <svg className="ml-auto w-4 h-4 text-muted-foreground flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      {open && (
        <div
          ref={popupRef}
          className="fixed z-[200] rounded-lg border border-input bg-white shadow-lg max-h-56 overflow-y-auto"
          style={{ top: pos.top, left: pos.left, width: pos.width }}
        >
          {printers.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">Немає принтерів</div>
          ) : printers.map(p => (
            <button key={p.id} type="button" onClick={() => { onChange(p.id); setOpen(false) }}
              className={`w-full px-3 py-2 text-sm text-left hover:bg-accent ${p.id === value ? 'bg-accent' : ''}`}>
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function MaterialSelect({ materials, value, onChange }: { materials: Material[]; value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const { btnRef, popupRef, pos } = useDropdownPos(open)
  const selected = materials.find(m => m.id === value)

  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      const t = e.target as Node
      if (btnRef.current?.contains(t) || popupRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open, btnRef, popupRef])

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm text-left flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
      >
        {selected ? (
          <>
            <span className="w-4 h-4 rounded-full flex-shrink-0 border" style={{ backgroundColor: selected.colorHex || '#ccc' }} />
            <span className="truncate">{selected.name}</span>
            {selected.color && <span className="text-muted-foreground text-xs flex-shrink-0">{selected.color}</span>}
          </>
        ) : (
          <span className="text-muted-foreground">Оберіть пластик</span>
        )}
        <svg className="ml-auto w-4 h-4 text-muted-foreground flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      {open && (
        <div
          ref={popupRef}
          className="fixed z-[200] rounded-lg border border-input bg-white shadow-lg max-h-56 overflow-y-auto"
          style={{ top: pos.top, left: pos.left, width: pos.width }}
        >
          {materials.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">Немає пластиків</div>
          ) : materials.map(m => (
            <button key={m.id} type="button" onClick={() => { onChange(m.id); setOpen(false) }}
              className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-accent ${m.id === value ? 'bg-accent' : ''}`}>
              <span className="w-4 h-4 rounded-full flex-shrink-0 border" style={{ backgroundColor: m.colorHex || '#ccc' }} />
              <span className="truncate font-medium">{m.name}</span>
              {m.color && <span className="text-muted-foreground text-xs flex-shrink-0 ml-auto">{m.color}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#8b5cf6']

export function CalculatorClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  const [materials, setMaterials] = useState<Material[]>([])
  const [printers, setPrinters] = useState<Printer[]>([])
  const [saving, setSaving] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Form state
  const [form, setForm] = useState({
    name: '',
    printerId: '',
    materialId: '',
    weightGrams: '',
    printTimeMinutes: '',
    layerHeight: '0.2',
    infillPercent: '15',
    hasSupports: false,
    supportDensity: '15',
    copies: '1',
    setupMinutes: '15',
    postProcMinutes: '0',
    marginPercent: '30',
    discountPercent: '0',
    clientName: '',
    notes: '',
  })
  const [postSteps, setPostSteps] = useState<PostStep[]>([])
  const [electricityRate] = useState(4.32)
  const [hourlyRate] = useState(0)

  useEffect(() => {
    fetch('/api/materials').then(r => r.json()).then(setMaterials)
    fetch('/api/printers').then(r => r.json()).then(setPrinters)
  }, [])

  useEffect(() => {
    if (!editId) return
    fetch(`/api/calculations/${editId}`).then(r => r.json()).then(data => {
      setForm({
        name: data.name || '',
        printerId: data.printerId || '',
        materialId: data.materialId || '',
        weightGrams: String(data.weightGrams || ''),
        printTimeMinutes: String(data.printTimeMinutes || ''),
        layerHeight: String(data.layerHeight || '0.2'),
        infillPercent: String(data.infillPercent || '15'),
        hasSupports: data.hasSupports || false,
        supportDensity: String(data.supportDensity || '15'),
        copies: String(data.copies || '1'),
        setupMinutes: String(data.setupMinutes || '15'),
        postProcMinutes: String(data.postProcMinutes || '0'),
        marginPercent: String(data.marginPercent || '30'),
        discountPercent: String(data.discountPercent || '0'),
        clientName: data.clientName || '',
        notes: data.notes || '',
      })
      if (data.postProcessSteps?.length) {
        setPostSteps(data.postProcessSteps.map((s: PostStep & { id?: string }) => ({ name: s.name, timeMinutes: s.timeMinutes, materialCost: s.materialCost })))
      }
      if (data.hasSupports || data.layerHeight !== 0.2 || data.infillPercent !== 15) {
        setShowAdvanced(true)
      }
    })
  }, [editId])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const selectedMaterial = materials.find(m => m.id === form.materialId)
  const selectedPrinter = printers.find(p => p.id === form.printerId)

  const costs = useMemo(() => {
    const postStepsCost = postSteps.reduce((s, ps) => s + (ps.materialCost || 0), 0)
    return calculateCosts({
      weightGrams: parseFloat(form.weightGrams) || 0,
      pricePerKg: selectedMaterial?.pricePerKg || 0,
      failureRate: selectedMaterial?.failureRate || 0,
      printTimeMinutes: parseFloat(form.printTimeMinutes) || 0,
      purchasePrice: selectedPrinter?.purchasePrice || 0,
      lifetimeHours: selectedPrinter?.lifetimeHours || 2000,
      maintenanceReservePerHour: selectedPrinter?.maintenanceReservePerHour || 0,
      powerWatts: selectedPrinter?.powerWatts || 0,
      electricityRate,
      setupMinutes: parseFloat(form.setupMinutes) || 15,
      postProcMinutes: parseFloat(form.postProcMinutes) || 0,
      hourlyRate,
      postProcessStepsCost: postStepsCost,
      copies: parseInt(form.copies) || 1,
    })
  }, [form, selectedMaterial, selectedPrinter, postSteps, electricityRate, hourlyRate])

  const sellingPrice = useMemo(() =>
    calculateSellingPrice(costs.totalCost, parseFloat(form.marginPercent) || 30, parseFloat(form.discountPercent) || 0),
    [costs.totalCost, form.marginPercent, form.discountPercent]
  )

  const chartData = [
    { name: 'Матеріал', value: parseFloat(costs.materialCost.toFixed(2)) },
    { name: 'Машина', value: parseFloat(costs.machineCost.toFixed(2)) },
    { name: 'Підготовка', value: parseFloat(costs.laborCost.toFixed(2)) },
    { name: 'Накладні', value: parseFloat(costs.overheadCost.toFixed(2)) },
  ].filter(d => d.value > 0)

  function addPostStep() {
    setPostSteps(prev => [...prev, { name: '', timeMinutes: 0, materialCost: 0 }])
  }

  function updatePostStep(i: number, field: keyof PostStep, value: string | number) {
    setPostSteps(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }

  function removePostStep(i: number) {
    setPostSteps(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSave() {
    if (!form.name) { toast.error('Введіть назву розрахунку'); return }
    setSaving(true)
    const url = editId ? `/api/calculations/${editId}` : '/api/calculations'
    const method = editId ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, postProcessSteps: postSteps }),
    })
    setSaving(false)
    if (res.ok) {
      toast.success(editId ? 'Розрахунок оновлено!' : 'Розрахунок збережено!')
      router.push('/calculations')
    } else {
      const err = await res.json()
      toast.error(err.error || 'Помилка збереження')
    }
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Form */}
        <div className="xl:col-span-2 space-y-6">

          {/* Basic info */}
          <Card>
            <CardHeader><CardTitle className="text-base">Основна інформація</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Назва виробу</Label>
                <Input name="name" value={form.name} onChange={handleChange} placeholder="Напр: Підставка для телефону" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Принтер</Label>
                  <PrinterSelect
                    printers={printers}
                    value={form.printerId}
                    onChange={v => setForm(p => ({ ...p, printerId: v }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Пластик</Label>
                  <MaterialSelect
                    materials={materials}
                    value={form.materialId}
                    onChange={v => setForm(p => ({ ...p, materialId: v }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Print parameters */}
          <Card>
            <CardHeader><CardTitle className="text-base">Параметри друку</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Вага (г)</Label>
                  <Input name="weightGrams" type="number" min="0" value={form.weightGrams} onChange={handleChange} placeholder="45" />
                </div>
                <div className="space-y-2">
                  <Label>Час друку (хв)</Label>
                  <Input name="printTimeMinutes" type="number" min="0" value={form.printTimeMinutes} onChange={handleChange} placeholder="240" />
                </div>
                <div className="space-y-2">
                  <Label>Кількість копій</Label>
                  <Input name="copies" type="number" min="1" value={form.copies} onChange={handleChange} />
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground"
                onClick={() => setShowAdvanced(!showAdvanced)}
                type="button"
              >
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                Розширені параметри
              </Button>

              {showAdvanced && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label>Висота шару (мм)</Label>
                    <Input name="layerHeight" type="number" min="0.05" step="0.05" value={form.layerHeight} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label>Заповнення (%)</Label>
                    <Input name="infillPercent" type="number" min="0" max="100" value={form.infillPercent} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label>Підтримки</Label>
                    <div className="flex rounded-lg border border-input overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setForm(p => ({ ...p, hasSupports: false }))}
                        className={`flex-1 text-xs px-3 py-1.5 transition-colors ${!form.hasSupports ? 'bg-primary text-white' : 'bg-transparent text-foreground hover:bg-accent'}`}
                      >Без підтримок</button>
                      <button
                        type="button"
                        onClick={() => setForm(p => ({ ...p, hasSupports: true }))}
                        className={`flex-1 text-xs px-3 py-1.5 border-l border-input transition-colors ${form.hasSupports ? 'bg-primary text-white' : 'bg-transparent text-foreground hover:bg-accent'}`}
                      >З підтримками</button>
                    </div>
                  </div>
                  {form.hasSupports && (
                    <div className="space-y-2">
                      <Label>Щільність підтримок (%)</Label>
                      <Input name="supportDensity" type="number" min="5" max="100" value={form.supportDensity} onChange={handleChange} />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Labor */}
          <Card>
            <CardHeader><CardTitle className="text-base">Підготовка та постобробка</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Підготовка (хв)</Label>
                  <Input name="setupMinutes" type="number" min="0" value={form.setupMinutes} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label>Постобробка (хв)</Label>
                  <Input name="postProcMinutes" type="number" min="0" value={form.postProcMinutes} onChange={handleChange} />
                </div>
              </div>

              {/* Post-processing steps */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Кроки постобробки</Label>
                  <Button size="sm" variant="outline" onClick={addPostStep} type="button" className="gap-1 h-7">
                    <Plus className="w-3 h-3" /> Додати
                  </Button>
                </div>
                {postSteps.map((step, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input
                      placeholder="Назва (шліфування, фарбування...)"
                      value={step.name}
                      onChange={e => updatePostStep(i, 'name', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number" min="0" placeholder="Хв"
                      value={step.timeMinutes || ''}
                      onChange={e => updatePostStep(i, 'timeMinutes', parseFloat(e.target.value) || 0)}
                      className="w-20"
                    />
                    <Input
                      type="number" min="0" placeholder="₴"
                      value={step.materialCost || ''}
                      onChange={e => updatePostStep(i, 'materialCost', parseFloat(e.target.value) || 0)}
                      className="w-24"
                    />
                    <Button size="icon" variant="ghost" className="h-9 w-9 hover:text-destructive flex-shrink-0" onClick={() => removePostStep(i)} type="button">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader><CardTitle className="text-base">Ціноутворення</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Маржа (%)</Label>
                  <Input name="marginPercent" type="number" min="0" value={form.marginPercent} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label>Знижка (%)</Label>
                  <Input name="discountPercent" type="number" min="0" max="100" value={form.discountPercent} onChange={handleChange} />
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ім&apos;я клієнта</Label>
                  <Input name="clientName" value={form.clientName} onChange={handleChange} placeholder="Іван Іваненко" />
                </div>
                <div className="space-y-2">
                  <Label>Нотатки</Label>
                  <Input name="notes" value={form.notes} onChange={handleChange} placeholder="Додаткова інформація..." />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={saving} className="w-full gap-2" size="lg">
            <Save className="w-4 h-4" />
            {saving ? 'Збереження...' : editId ? 'Оновити розрахунок' : 'Зберегти розрахунок'}
          </Button>
        </div>

        {/* Right: Cost breakdown */}
        <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <Card>
            <CardHeader><CardTitle className="text-base">Розбивка витрат</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {chartData.length > 0 && (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => typeof v === 'number' ? `${v.toFixed(2)} ₴` : v} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}

              <div className="space-y-2 text-sm">
                {[
                  { label: 'Матеріал', value: costs.materialCost },
                  { label: 'Машинний час', value: costs.machineCost },
                  { label: 'Підготовка', value: costs.laborCost },
                  { label: 'Накладні', value: costs.overheadCost },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-muted-foreground">{label}</span>
                    <span>{value.toFixed(2)} ₴</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Собівартість</span>
                  <span>{costs.totalCost.toFixed(2)} ₴</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Маржа {form.marginPercent}%</span>
                  <span>+ {(costs.totalCost * parseFloat(form.marginPercent || '0') / 100).toFixed(2)} ₴</span>
                </div>
                {parseFloat(form.discountPercent) > 0 && (
                  <div className="flex justify-between text-xs text-green-600">
                    <span>Знижка {form.discountPercent}%</span>
                    <span>- {(costs.totalCost * (1 + parseFloat(form.marginPercent) / 100) * parseFloat(form.discountPercent) / 100).toFixed(2)} ₴</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span>Ціна продажу</span>
                  <Badge className="text-base px-3 py-1">{sellingPrice.toFixed(2)} ₴</Badge>
                </div>
                {parseInt(form.copies) > 1 && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>За одиницю</span>
                    <span>{(sellingPrice / parseInt(form.copies)).toFixed(2)} ₴</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {selectedMaterial && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Філамент</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                <p className="font-medium">{selectedMaterial.name}</p>
                <p className="text-muted-foreground">{selectedMaterial.type} · {selectedMaterial.pricePerKg} ₴/кг</p>
                <p className="text-muted-foreground">Відходи: {(selectedMaterial.failureRate * 100).toFixed(0)}%</p>
              </CardContent>
            </Card>
          )}

          {selectedPrinter && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Принтер</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                <p className="font-medium">{selectedPrinter.name}</p>
                <p className="text-muted-foreground">{selectedPrinter.powerWatts} Вт · {selectedPrinter.lifetimeHours.toLocaleString()} год ресурс</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
