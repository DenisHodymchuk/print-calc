'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp, TrendingDown, Calculator, Layers, Printer, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type DashboardData = {
  totalCalcs: number
  materialCount: number
  printerCount: number
  thisMonth: { revenue: number; cost: number; profit: number; count: number }
  lastMonth: { revenue: number }
  recentCalcs: {
    id: string
    name: string
    status: string
    sellingPrice: number
    createdAt: string
    material: { name: string; colorHex: string | null } | null
    printer: { name: string } | null
  }[]
  monthlyChart: { month: string; revenue: number; cost: number; profit: number }[]
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Чернетка', QUOTED: 'Кошторис', APPROVED: 'Підтверджено',
  PRINTING: 'Друкується', DONE: 'Готово',
}

export function DashboardClient() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setData)
  }, [])

  if (!data) {
    return <div className="p-6 text-muted-foreground">Завантаження...</div>
  }

  const revenueChange = data.lastMonth.revenue > 0
    ? ((data.thisMonth.revenue - data.lastMonth.revenue) / data.lastMonth.revenue * 100).toFixed(0)
    : null

  return (
    <div className="p-6 space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Дохід цього місяця</p>
                <p className="text-2xl font-bold mt-1">{data.thisMonth.revenue.toFixed(0)} ₴</p>
                {revenueChange !== null && (
                  <p className={`text-xs mt-1 flex items-center gap-1 ${parseFloat(revenueChange) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {parseFloat(revenueChange) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {revenueChange}% vs минулий місяць
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Прибуток цього місяця</p>
            <p className="text-2xl font-bold mt-1">{data.thisMonth.profit.toFixed(0)} ₴</p>
            <p className="text-xs text-muted-foreground mt-1">{data.thisMonth.count} розрахунків</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Layers className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Матеріали</p>
                <p className="text-2xl font-bold">{data.materialCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Printer className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Принтери</p>
                <p className="text-2xl font-bold">{data.printerCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Дохід за останні 6 місяців</CardTitle>
          </CardHeader>
          <CardContent>
            {data.monthlyChart.some(m => m.revenue > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.monthlyChart} barSize={20}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => typeof v === 'number' ? `${v.toFixed(0)} ₴` : v} />
                  <Legend />
                  <Bar dataKey="revenue" name="Дохід" fill="#FF4500" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cost" name="Витрати" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" name="Прибуток" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                <Calculator className="w-12 h-12 mb-3 opacity-30" />
                <p>Немає даних для відображення</p>
                <p className="text-sm">Створіть перший розрахунок</p>
                <Button className="mt-4 gap-2 bg-[#1a1a1a] hover:bg-[#333] text-white font-bold" onClick={() => router.push('/calculator')}>
                  <Plus className="w-4 h-4" /> Новий розрахунок
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent calculations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Останні розрахунки</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.push('/calculations')}>Всі</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentCalcs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Немає розрахунків</p>
            ) : (
              data.recentCalcs.map(c => (
                <div key={c.id} className="flex items-center gap-3">
                  {c.material?.colorHex && (
                    <div className="w-8 h-8 rounded-full border flex-shrink-0"
                      style={{ backgroundColor: c.material.colorHex }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString('uk-UA')}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold">{c.sellingPrice.toFixed(0)} ₴</p>
                    <Badge variant="secondary" className="text-xs">
                      {STATUS_LABELS[c.status] || c.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
