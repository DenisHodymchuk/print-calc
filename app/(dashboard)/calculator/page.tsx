import { Header } from '@/components/layout/header'
import { CalculatorClient } from './calculator-client'

export default function CalculatorPage() {
  return (
    <>
      <Header title="Розрахунок" accent="вартості друку" subtitle="Оберіть матеріал, введіть параметри — отримайте точну ціну" />
      <CalculatorClient />
    </>
  )
}
