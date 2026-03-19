import { Header } from '@/components/layout/header'
import { LibraryClient } from './library-client'

export default function LibraryPage() {
  return (
    <>
      <Header title="Моя" accent="бібліотека" subtitle="Збережені моделі для швидкого повторного розрахунку" />
      <LibraryClient />
    </>
  )
}
