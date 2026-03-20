'use client'

import { Check, X, Crown, MessageSquare } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { toast } from 'sonner'
import { usePremium } from '@/lib/use-premium'

const features = [
  { name: 'Калькулятор вартості', free: true, pro: true },
  { name: 'Кошторис для клієнта', free: true, pro: true },
  { name: 'Принтери (до 3)', free: true, pro: false },
  { name: 'Принтери (необмежено)', free: false, pro: true },
  { name: 'Філаменти (до 5)', free: true, pro: false },
  { name: 'Філаменти (необмежено)', free: false, pro: true },
  { name: 'Розрахунки (до 10)', free: true, pro: false },
  { name: 'Розрахунки (необмежено)', free: false, pro: true },
  { name: 'AMS багатокольоровий друк', free: false, pro: true },
  { name: 'Бібліотека моделей', free: false, pro: true },
  { name: 'Дашборд з аналітикою', free: false, pro: true },
  { name: 'Фото виробу в кошторисі', free: false, pro: true },
  { name: 'Термін готовності', free: false, pro: true },
  { name: 'Персональні знижки', free: false, pro: true },
  { name: 'Вибір кількості клієнтом', free: false, pro: true },
  { name: 'Власний бренд на кошторисі', free: false, pro: true },
]

function Icon({ ok }: { ok: boolean }) {
  return ok
    ? <Check className="w-4 h-4 text-green-500" />
    : <X className="w-4 h-4 text-muted-foreground/30" />
}

export default function PricingPage() {
  const { isPremium } = usePremium()
  const router = useRouter()

  async function handleBuyRequest() {
    const res = await fetch('/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '💎 Хочу придбати Premium підписку! Підкажіть деталі оплати.' }),
    })
    if (res.ok) {
      toast.success('Запит надіслано! Ми відповімо найближчим часом.')
      router.push('/support')
    } else {
      toast.error('Помилка, спробуйте ще раз')
    }
  }

  return (
    <>
      <Header title="Тарифні" accent="плани" subtitle="Оберіть план який підходить вам" />
      <div className="p-6 max-w-3xl mx-auto">
        {isPremium && (
          <div className="mb-6 flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl px-4 py-3">
            <Crown className="w-5 h-5 text-amber-500" />
            <span className="font-semibold text-sm text-amber-700">У вас активний Преміум доступ</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Free */}
          <Card className={`${!isPremium ? 'ring-2 ring-primary' : ''}`}>
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="font-bold text-lg">Free</h3>
                <p className="text-2xl font-bold mt-1">0 ₴ <span className="text-sm font-normal text-muted-foreground">/ назавжди</span></p>
                <p className="text-xs text-muted-foreground mt-1">Базовий функціонал для початку</p>
              </div>
              {!isPremium && (
                <div className="text-center text-xs text-primary font-medium bg-primary/5 rounded-lg py-2">
                  Ваш поточний план
                </div>
              )}
              <div className="space-y-2.5">
                {features.filter(f => f.free).map(f => (
                  <div key={f.name} className="flex items-center gap-2.5 text-sm">
                    <Icon ok={true} />
                    <span>{f.name}</span>
                  </div>
                ))}
                {features.filter(f => !f.free).map(f => (
                  <div key={f.name} className="flex items-center gap-2.5 text-sm text-muted-foreground/50">
                    <Icon ok={false} />
                    <span>{f.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pro */}
          <Card className={`${isPremium ? 'ring-2 ring-amber-400' : ''} relative overflow-hidden`}>
            <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-400 to-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
              PRO
            </div>
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  Premium <Crown className="w-4 h-4 text-amber-500" />
                </h3>
                <p className="text-2xl font-bold mt-1">150 ₴ <span className="text-sm font-normal text-muted-foreground">/ місяць</span></p>
                <p className="text-xs text-muted-foreground mt-1">Повний функціонал без обмежень</p>
              </div>
              {isPremium && (
                <div className="text-center text-xs text-amber-600 font-medium bg-amber-50 rounded-lg py-2">
                  Ваш поточний план
                </div>
              )}
              <div className="space-y-2.5">
                {features.filter(f => f.pro).map(f => (
                  <div key={f.name} className="flex items-center gap-2.5 text-sm">
                    <Icon ok={true} />
                    <span>{f.name}</span>
                  </div>
                ))}
              </div>
              {!isPremium && (
                <Button onClick={handleBuyRequest} className="w-full gap-2 mt-2 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white">
                  <MessageSquare className="w-4 h-4" /> Хочу Premium
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
