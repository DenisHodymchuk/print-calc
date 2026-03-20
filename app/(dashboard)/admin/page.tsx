'use client'

import { Header } from '@/components/layout/header'
import { AdminClient } from './admin-client'
import { usePremium } from '@/lib/use-premium'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AdminPage() {
  const { isAdmin } = usePremium()
  const router = useRouter()

  useEffect(() => {
    if (isAdmin === false) router.replace('/dashboard')
  }, [isAdmin, router])

  if (!isAdmin) return null

  return (
    <>
      <Header title="Адмін" accent="панель" subtitle="Управління користувачами та преміум доступом" />
      <AdminClient />
    </>
  )
}
