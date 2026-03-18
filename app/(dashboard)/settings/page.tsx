import { Header } from '@/components/layout/header'
import { SettingsClient } from './settings-client'

export default function SettingsPage() {
  return (
    <>
      <Header title="Налаштування" accent="профілю" subtitle="Ставки, особиста інформація та безпека" />
      <SettingsClient />
    </>
  )
}
