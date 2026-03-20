'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, Calendar, Tag } from 'lucide-react'
import { Toaster } from '@/components/ui/sonner'

type Quote = {
  id: string
  name: string
  status: string
  weightGrams: number
  printTimeMinutes: number
  sellingPrice: number
  discountPercent: number
  marginPercent: number
  totalCost: number
  copies: number
  clientName: string | null
  photoUrl: string | null
  notes: string | null
  quoteApprovedAt: string | null
  createdAt: string
  deliveryDate: string | null
  material: { name: string; type: string; colorHex: string | null; color: string | null } | null
  printer: { name: string } | null
  seller: { name: string | null; businessName: string | null; email: string }
  postProcessSteps: { name: string; timeMinutes: number }[]
  amsMaterials: { materialId: string; weightGrams: number; name: string | null; colorHex: string | null }[] | null
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
  const isAms = quote.amsMaterials && quote.amsMaterials.length > 0
  const priceBeforeDiscount = quote.discountPercent > 0
    ? quote.sellingPrice / (1 - quote.discountPercent / 100)
    : null

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
        {/* Photo — large */}
        {quote.photoUrl && (
          <div className="rounded-2xl overflow-hidden border">
            <img
              src={quote.photoUrl}
              alt={quote.name}
              className="w-full max-h-96 object-cover"
            />
          </div>
        )}

        {/* Title & client */}
        <div>
          {quote.clientName && (
            <p className="text-sm text-muted-foreground mb-1">Для: {quote.clientName}</p>
          )}
          <h1 className="text-2xl font-bold">{quote.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date(quote.createdAt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Materials */}
        {(isAms || quote.material) && (
          <div className="flex items-center gap-2 flex-wrap">
            {isAms ? (
              <>
                <Badge variant="outline" className="text-xs gap-1">
                  <Tag className="w-3 h-3" /> AMS
                </Badge>
                {quote.amsMaterials!.map((a, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    {a.colorHex && (
                      <span className="w-2.5 h-2.5 rounded-full border" style={{ backgroundColor: a.colorHex }} />
                    )}
                    {a.name}
                  </span>
                ))}
              </>
            ) : quote.material && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                {quote.material.colorHex && (
                  <span className="w-2.5 h-2.5 rounded-full border" style={{ backgroundColor: quote.material.colorHex }} />
                )}
                {quote.material.name}
              </span>
            )}
          </div>
        )}

        {/* Delivery date */}
        {quote.deliveryDate && (
          <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
            <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Орієнтовний термін готовності</p>
              <p className="font-semibold">
                {new Date(quote.deliveryDate).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        )}

        <Separator />

        {/* Pricing */}
        <div className="space-y-4">
          {quote.copies > 1 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Кількість</span>
              <span className="font-medium">{quote.copies} шт</span>
            </div>
          )}

          {/* Discount — prominent */}
          {quote.discountPercent > 0 && priceBeforeDiscount && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-green-700 font-semibold text-sm">Персональна знижка</p>
                <p className="text-green-600 text-xs mt-0.5">Спеціальна ціна для вас</p>
              </div>
              <div className="text-right">
                <span className="text-green-700 font-bold text-xl">-{quote.discountPercent}%</span>
                <p className="text-xs text-green-600 line-through">{priceBeforeDiscount.toFixed(0)} ₴</p>
              </div>
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
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-700">Замовлення підтверджено</p>
              <p className="text-sm text-green-600">
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
