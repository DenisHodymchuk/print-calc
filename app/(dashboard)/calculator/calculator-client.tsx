'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Plus, Trash2, Save, ChevronDown, ChevronUp } from 'lucide-react'
import { calculateCosts, calculateSellingPrice } from '@/lib/cost-calculator'

type Material = { id: string; name: string; brand: string | null; type: string; colorHex: string | null; pricePerKg: number; density: number; failureRate: number }
type Printer = { id: string; name: string; brand: string | null; purchasePrice: number; powerWatts: number; lifetimeHours: number; maintenanceReservePerHour: number }
type PostStep = { name: string; timeMinutes: number; materialCost: number }

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#8b5cf6']

export function CalculatorClient() {
  const router = useRouter()
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
    clientEmail: '',
    notes: '',
  })
  const [postSteps, setPostSteps] = useState<PostStep[]>([])
  const [electricityRate] = useState(4.32)
  const [hourlyRate] = useState(0)

  useEffect(() => {
    fetch('/api/materials').then(r => r.json()).then(setMaterials)
    fetch('/api/printers').then(r => r.json()).then(setPrinters)
  }, [])

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
    { name: 'Праця', value: parseFloat(costs.laborCost.toFixed(2)) },
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
    const res = await fetch('/api/calculations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, postProcessSteps: postSteps }),
    })
    setSaving(false)
    if (res.ok) {
      const data = await res.json()
      toast.success('Розрахунок збережено!')
      router.push(`/calculations`)
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
                  <Select value={form.printerId} onValueChange={v => setForm(p => ({ ...p, printerId: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Оберіть принтер" />
                    </SelectTrigger>
                    <SelectContent>
                      {printers.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Матеріал</Label>
                  <Select value={form.materialId} onValueChange={v => setForm(p => ({ ...p, materialId: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Оберіть матеріал" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map(m => (
                        <SelectItem key={m.id} value={m.id}>
                          <span className="flex items-center gap-2">
                            {m.colorHex && <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: m.colorHex }} />}
                            {m.name} — {m.pricePerKg} ₴/кг
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <Select value={form.hasSupports ? 'yes' : 'no'} onValueChange={v => setForm(p => ({ ...p, hasSupports: v === 'yes' }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">Без підтримок</SelectItem>
                        <SelectItem value="yes">З підтримками</SelectItem>
                      </SelectContent>
                    </Select>
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
            <CardHeader><CardTitle className="text-base">Праця та постобробка</CardTitle></CardHeader>
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
                  <Label>Email клієнта</Label>
                  <Input name="clientEmail" type="email" value={form.clientEmail} onChange={handleChange} placeholder="client@example.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Нотатки</Label>
                <Input name="notes" value={form.notes} onChange={handleChange} placeholder="Додаткова інформація для кошторису..." />
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={saving} className="w-full gap-2" size="lg">
            <Save className="w-4 h-4" />
            {saving ? 'Збереження...' : 'Зберегти розрахунок'}
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
                    <Tooltip formatter={(v: number) => `${v.toFixed(2)} ₴`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}

              <div className="space-y-2 text-sm">
                {[
                  { label: 'Матеріал', value: costs.materialCost },
                  { label: 'Машинний час', value: costs.machineCost },
                  { label: 'Праця', value: costs.laborCost },
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
              <CardContent className="pt-4 text-sm space-y-1">
                <p className="font-medium">{selectedMaterial.name}</p>
                <p className="text-muted-foreground">{selectedMaterial.type} · {selectedMaterial.pricePerKg} ₴/кг</p>
                <p className="text-muted-foreground">Відходи: {(selectedMaterial.failureRate * 100).toFixed(0)}%</p>
              </CardContent>
            </Card>
          )}

          {selectedPrinter && (
            <Card>
              <CardContent className="pt-4 text-sm space-y-1">
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
