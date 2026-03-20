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
  const pricePerUnit = quote.sellingPrice / quote.copies
  const [qty, setQty] = useState(quote.copies)
  const totalPrice = pricePerUnit * qty

  async function handleApprove() {
    setApproving(true)
    const res = await fetch(`/api/quote/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ copies: qty }),
    })
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

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Photo + title side by side */}
        <div className="flex gap-4 items-start">
          {quote.photoUrl && (
            <div className="rounded-xl overflow-hidden border flex-shrink-0 w-32 h-32">
              <img src={quote.photoUrl} alt={quote.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            {quote.clientName && (
              <p className="text-xs text-muted-foreground">Для: {quote.clientName}</p>
            )}
            <h1 className="text-xl font-bold mt-0.5">{quote.name}</h1>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(quote.createdAt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            {/* Materials inline */}
            {(isAms || quote.material) && (
              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                {isAms ? (
                  <>
                    <Badge variant="outline" className="text-[10px] gap-0.5 px-1.5 py-0">
                      <Tag className="w-2.5 h-2.5" /> AMS
                    </Badge>
                    {quote.amsMaterials!.map((a, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        {a.colorHex && <span className="w-2 h-2 rounded-full border" style={{ backgroundColor: a.colorHex }} />}
                        {a.name}
                      </span>
                    ))}
                  </>
                ) : quote.material && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    {quote.material.colorHex && <span className="w-2 h-2 rounded-full border" style={{ backgroundColor: quote.material.colorHex }} />}
                    {quote.material.name}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Delivery date */}
        {quote.deliveryDate && (
          <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
            <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[11px] text-muted-foreground">Орієнтовний термін готовності</p>
              <p className="font-semibold text-sm">
                {new Date(quote.deliveryDate).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            {qty > quote.copies && (
              <span className="text-[10px] text-primary/70">* термін може збільшитись</span>
            )}
          </div>
        )}

        <Separator />

        {/* Pricing */}
        <div className="space-y-3">
          {/* Quantity selector */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Кількість</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setQty(q => Math.max(1, q - 1))}
                disabled={approved}
                className="w-7 h-7 rounded-md border border-input flex items-center justify-center text-sm hover:bg-accent transition-colors disabled:opacity-50"
              >-</button>
              <span className="w-8 text-center font-semibold text-sm">{qty}</span>
              <button
                type="button"
                onClick={() => setQty(q => q + 1)}
                disabled={approved}
                className="w-7 h-7 rounded-md border border-input flex items-center justify-center text-sm hover:bg-accent transition-colors disabled:opacity-50"
              >+</button>
            </div>
          </div>

          {qty > 1 && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Ціна за 1 шт</span>
              <span>{pricePerUnit.toFixed(2)} ₴</span>
            </div>
          )}

          {/* Discount */}
          {quote.discountPercent > 0 && priceBeforeDiscount && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2.5 flex items-center justify-between">
              <div>
                <p className="text-green-700 font-semibold text-xs">Персональна знижка</p>
                <p className="text-green-600 text-[10px] mt-0.5">Спеціальна ціна для вас</p>
              </div>
              <div className="text-right">
                <span className="text-green-700 font-bold text-lg">-{quote.discountPercent}%</span>
                <p className="text-[10px] text-green-600 line-through">{(priceBeforeDiscount / quote.copies * qty).toFixed(0)} ₴</p>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="font-semibold">Вартість</span>
            <span className="text-2xl font-bold">{totalPrice.toFixed(2)} ₴</span>
          </div>
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
