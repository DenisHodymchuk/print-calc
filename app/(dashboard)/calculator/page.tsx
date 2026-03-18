import { Header } from '@/components/layout/header'
import { CalculatorClient } from './calculator-client'

export default function CalculatorPage() {
  return (
    <>
      <Header title="Калькулятор друку" />
      <CalculatorClient />
    </>
  )
}
