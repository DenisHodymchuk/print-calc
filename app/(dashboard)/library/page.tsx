'use client'

import { Header } from '@/components/layout/header'
import { LibraryClient } from './library-client'
import { PremiumLock } from '@/components/premium-lock'

export default function LibraryPage() {
  return (
    <>
      <Header title="Моя" accent="бібліотека" subtitle="Збережені моделі для швидкого повторного розрахунку" />
      <PremiumLock feature="Бібліотека моделей доступна у Преміум">
        <LibraryClient />
      </PremiumLock>
    </>
  )
}
