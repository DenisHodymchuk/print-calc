import { Header } from '@/components/layout/header'
import { SettingsClient } from './settings-client'

export default function SettingsPage() {
  return (
    <>
      <Header title="Налаштування" />
      <SettingsClient />
    </>
  )
}
