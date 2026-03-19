'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, Clock, Package, Printer, Layers } from 'lucide-react'
import { Toaster } from '@/components/ui/sonner'

type Quote = {
  id: string
  name: string
  status: string
  weightGrams: number
  printTimeMinutes: number
  sellingPrice: number
  discountPercent: number
  copies: number
  clientName: string | null
  photoUrl: string | null
  notes: string | null
  quoteApprovedAt: string | null
  createdAt: string
  material: { name: string; type: string; colorHex: string | null; color: string | null } | null
  printer: { name: string } | null
  seller: { name: string | null; businessName: string | null; email: string }
  postProcessSteps: { name: string; timeMinutes: number }[]
  amsMaterials: { materialId: string; weightGrams: number; name: string | null; colorHex: string | null }[] | null
}

function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return h > 0 ? `${h} год ${m} хв` : `${m} хв`
}

export function QuoteClient({ quote, token }: { quote: Quote; token: string }) {
  const [approved, setApproved] = useState(!!quote.quoteApprovedAt)
  const [approving, setApproving] = useState(false)

  async function handleApprove() {
    setApproving(true)
    const res = await fetch(`/api/quote/${token}`, { method: 'POST' })
    setApproving(false)
    if (res.ok) {
      setApproved(true)
      toast.success('Замовлення підтверджено!')
    } else {
      const data = await res.json()
      toast.error(data.error || 'Помилка підтвердження')
    }
  }

  const businessName = quote.seller.businessName || quote.seller.name || quote.seller.email

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-right" />
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="font-semibold">{businessName}</p>
            <p className="text-sm text-muted-foreground">Кошторис на 3D друк</p>
          </div>
          <Badge variant={approved ? 'default' : 'outline'}>
            {approved ? '✓ Підтверджено' : 'Очікує підтвердження'}
          </Badge>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Main info with photo */}
        <div className={`flex gap-6 ${quote.photoUrl ? 'items-start' : ''}`}>
          {quote.photoUrl && (
            <div className="rounded-xl overflow-hidden border flex-shrink-0 w-48">
              <img
                src={quote.photoUrl}
                alt={quote.name}
                className="w-full h-48 object-cover"
              />
            </div>
          )}
          <div className="flex-1 space-y-4">
            <div>
              {quote.clientName && (
                <p className="text-sm text-muted-foreground mb-1">Для: {quote.clientName}</p>
              )}
              <h1 className="text-2xl font-bold">{quote.name}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Дата: {new Date(quote.createdAt).toLocaleDateString('uk-UA')}
              </p>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-3">
              {(() => {
                const isAms = quote.amsMaterials && quote.amsMaterials.length > 0
                const totalWeight = isAms
                  ? quote.amsMaterials!.reduce((s, a) => s + (a.weightGrams || 0), 0)
                  : quote.weightGrams
                return [
                  { icon: Clock, label: 'Час друку', value: formatTime(quote.printTimeMinutes) },
                  { icon: Package, label: 'Вага', value: `${totalWeight} г` },
                  ...(quote.printer ? [{ icon: Printer, label: 'Принтер', value: quote.printer.name }] : []),
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-2 bg-muted/50 rounded-lg p-2.5">
                    <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="font-medium text-sm">{value}</p>
                    </div>
                  </div>
                ))
              })()}
            </div>

            {/* Materials */}
            {quote.amsMaterials && quote.amsMaterials.length > 0 ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Пластик (AMS)</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {quote.amsMaterials.map((a, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-muted/50 rounded-full px-2.5 py-1">
                      {a.colorHex && (
                        <div className="w-3.5 h-3.5 rounded-full border" style={{ backgroundColor: a.colorHex }} />
                      )}
                      <span className="text-xs">{a.name || 'Матеріал'}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : quote.material ? (
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-muted-foreground" />
                {quote.material.colorHex && (
                  <div className="w-3.5 h-3.5 rounded-full border" style={{ backgroundColor: quote.material.colorHex }} />
                )}
                <span className="text-xs">{quote.material.name}</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Post-processing */}
        {quote.postProcessSteps.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Постобробка</p>
            <div className="space-y-1">
              {quote.postProcessSteps.map((s, i) => (
                <div key={i} className="flex justify-between text-sm text-muted-foreground">
                  <span>{s.name}</span>
                  {s.timeMinutes > 0 && <span>{formatTime(s.timeMinutes)}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {quote.notes && (
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">{quote.notes}</p>
          </div>
        )}

        <Separator />

        {/* Pricing */}
        <div className="space-y-3">
          {quote.copies > 1 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Кількість</span>
              <span>{quote.copies} шт</span>
            </div>
          )}
          {quote.discountPercent > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Знижка</span>
              <span>-{quote.discountPercent}%</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Вартість</span>
            <span className="text-3xl font-bold">{quote.sellingPrice.toFixed(2)} ₴</span>
          </div>
          {quote.copies > 1 && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>За одиницю</span>
              <span>{(quote.sellingPrice / quote.copies).toFixed(2)} ₴</span>
            </div>
          )}
        </div>

        {/* CTA */}
        {approved ? (
          <div className="flex items-center gap-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-700 dark:text-green-400">Замовлення підтверджено</p>
              <p className="text-sm text-green-600 dark:text-green-500">
                Ми вже отримали підтвердження і беремось до роботи
              </p>
            </div>
          </div>
        ) : (
          <Button
            size="lg"
            className="w-full text-base py-6"
            onClick={handleApprove}
            disabled={approving}
          >
            {approving ? 'Підтвердження...' : 'Підтвердити замовлення'}
          </Button>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Кошторис від {businessName}
        </p>
      </div>
    </div>
  )
}
