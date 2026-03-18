# 3D Print Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack Next.js web application for a 3D printing service owner to calculate print costs, manage materials and printers, and generate client-facing quotes.

**Architecture:** Next.js 14 App Router monorepo with API Routes as the backend, Prisma ORM connecting to PostgreSQL. All monetary values use UAH (₴) and are rounded to 2 decimal places. Pure cost calculation logic lives in `lib/calculator.ts` and is fully unit-tested.

**Tech Stack:** Next.js 14, TypeScript, Prisma, PostgreSQL, NextAuth.js (JWT), Shadcn/ui, Tailwind CSS, Recharts, Three.js, Vitest, Docker

**Spec:** `docs/superpowers/specs/2026-03-18-3d-print-calculator-design.md`

---

## File Map

```
app/
  (auth)/
    login/page.tsx
    register/page.tsx
  (dashboard)/
    layout.tsx                      — sidebar + nav + auth guard
    dashboard/page.tsx
    calculator/page.tsx
    calculator/[id]/page.tsx
    calculations/page.tsx
    materials/page.tsx
    printers/page.tsx
    printers/[id]/page.tsx
    settings/page.tsx
  quote/[token]/page.tsx            — public, no auth
  api/
    auth/[...nextauth]/route.ts
    calculations/route.ts
    calculations/[id]/route.ts
    calculations/[id]/duplicate/route.ts
    materials/route.ts
    materials/[id]/route.ts
    materials/[id]/purchases/route.ts
    printers/route.ts
    printers/[id]/route.ts
    quotes/[token]/route.ts
    quotes/[token]/approve/route.ts
    upload/route.ts

components/
  layout/sidebar.tsx
  layout/top-nav.tsx
  calculator/calculator-form.tsx
  calculator/step-setup.tsx
  calculator/step-parameters.tsx
  calculator/step-postprocessing.tsx
  calculator/step-pricing.tsx
  calculator/cost-breakdown-panel.tsx
  materials/material-card.tsx
  materials/material-form.tsx
  materials/material-filters.tsx
  printers/printer-card.tsx
  printers/printer-form.tsx
  printers/roi-calculator.tsx
  calculations/calculations-table.tsx
  quote/quote-card.tsx

lib/
  prisma.ts
  calculator.ts
  auth.ts
  upload.ts

prisma/schema.prisma

__tests__/
  lib/calculator.test.ts

middleware.ts
Dockerfile
docker-compose.yml
.env.example
```

---

## Phase 1 — Project Foundation

### Task 1: Scaffold Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`
- Create: `.env.example`, `.env.local` (gitignored), `.gitignore`

- [ ] **Step 1: Create Next.js app with TypeScript and Tailwind**

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*"
```

- [ ] **Step 2: Install core dependencies**

```bash
npm install prisma @prisma/client next-auth bcryptjs
npm install -D @types/bcryptjs vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Install Shadcn/ui**

```bash
npx shadcn@latest init
# Choose: Default style, Slate base color, yes CSS variables
```

- [ ] **Step 4: Add required Shadcn components**

```bash
npx shadcn@latest add button input label card form select badge dialog sheet tabs separator avatar dropdown-menu toast progress
```

- [ ] **Step 5: Add Recharts and Three.js**

```bash
npm install recharts three @types/three
```

- [ ] **Step 6: Create `.env.example`**

```env
DATABASE_URL=postgresql://printuser:password@localhost:5432/print_calc
NEXTAUTH_SECRET=your-32-char-secret-here
NEXTAUTH_URL=http://localhost:3000
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE_MB=50
```

- [ ] **Step 7: Create `.env.local`** (copy from `.env.example`, fill in values)

- [ ] **Step 8: Add vitest config `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

- [ ] **Step 9: Create `vitest.setup.ts`**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 10: Add test script to `package.json`**

```json
"scripts": {
  "test": "vitest",
  "test:run": "vitest run"
}
```

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with dependencies"
```

---

### Task 2: Prisma schema and database

**Files:**
- Create: `prisma/schema.prisma`
- Create: `lib/prisma.ts`

- [ ] **Step 1: Initialize Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

- [ ] **Step 2: Write `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Status {
  DRAFT
  QUOTED
  APPROVED
  PRINTING
  DONE
}

enum MaterialType {
  PLA
  PETG
  ABS
  ASA
  TPU
  PA
  PC
  OTHER
}

model User {
  id                   String   @id @default(cuid())
  email                String   @unique
  password             String
  name                 String
  businessName         String?
  hourlyRate           Float    @default(0)
  electricityRate      Float    @default(4.32)
  overheadPerJob       Float    @default(0)
  defaultMarginPercent Float    @default(30)
  createdAt            DateTime @default(now())
  // Account deletion is out of scope for v1.

  printers     Printer[]
  materials    Material[]
  calculations Calculation[]
}

model Printer {
  id               String   @id @default(cuid())
  userId           String
  user             User     @relation(fields: [userId], references: [id], onDelete: Restrict)
  name             String
  brand            String?
  purchasePrice    Float
  powerWatts       Float
  lifetimeHours    Float    @default(2000)
  maintenanceUAH   Float    @default(0)
  avgHoursPerMonth Float    @default(160)
  notes            String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  calculations Calculation[]
}

model Material {
  id          String       @id @default(cuid())
  userId      String
  user        User         @relation(fields: [userId], references: [id], onDelete: Restrict)
  name        String
  brand       String
  type        MaterialType
  color       String
  colorHex    String
  pricePerKg  Float
  density     Float        @default(1.24)
  failureRate Float        @default(0.03)
  notes       String?
  inStock     Boolean      @default(true)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  purchases    MaterialPurchase[]
  calculations Calculation[]
}

model MaterialPurchase {
  id         String   @id @default(cuid())
  materialId String
  material   Material @relation(fields: [materialId], references: [id], onDelete: Cascade)
  userId     String
  date       DateTime
  pricePerKg Float
  weightKg   Float
  supplier   String?
  createdAt  DateTime @default(now())
}

model Calculation {
  id         String    @id @default(cuid())
  userId     String
  user       User      @relation(fields: [userId], references: [id])
  printerId  String?
  printer    Printer?  @relation(fields: [printerId], references: [id], onDelete: SetNull)
  materialId String?
  material   Material? @relation(fields: [materialId], references: [id], onDelete: SetNull)

  name String

  weightGrams        Float
  printTimeMinutes   Float
  setupMinutes       Float   @default(15)
  layerHeightMm      Float?
  infillPercent      Float?
  hasSupports        Boolean @default(false)
  supportDensity     Float?
  stlFileUrl         String?

  postProcessingSteps PostProcessingStep[]

  rawMaterialCost      Float @default(0)
  failureCost          Float @default(0)
  machineCost          Float @default(0)
  laborCost            Float @default(0)
  postProcMaterialCost Float @default(0)
  overheadCost         Float @default(0)
  totalCost            Float @default(0)

  marginPercent   Float   @default(30)
  discountPercent Float   @default(0)
  sellingPrice    Float   @default(0)
  isBelowCost     Boolean @default(false)

  clientName      String?
  quoteToken      String?   @unique
  quoteExpiresAt  DateTime?
  quoteApprovedAt DateTime?
  photoUrl        String?

  status Status @default(DRAFT)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model PostProcessingStep {
  id            String      @id @default(cuid())
  calculationId String
  calculation   Calculation @relation(fields: [calculationId], references: [id], onDelete: Cascade)
  name          String
  timeMinutes   Float
  materialCost  Float       @default(0)
}
```

- [ ] **Step 3: Create `lib/prisma.ts`**

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === 'development' ? ['query'] : [] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 4: Run migration**

```bash
npx prisma migrate dev --name init
```

Expected: migration created and applied, Prisma client generated.

- [ ] **Step 5: Verify schema was applied**

```bash
npx prisma studio
```

Open http://localhost:5555, verify all tables exist.

- [ ] **Step 6: Commit**

```bash
git add prisma/ lib/prisma.ts
git commit -m "feat: add Prisma schema and DB setup"
```

---

### Task 3: Core calculation logic (TDD)

**Files:**
- Create: `lib/calculator.ts`
- Create: `__tests__/lib/calculator.test.ts`

- [ ] **Step 1: Write failing tests for `calculateCosts`**

Create `__tests__/lib/calculator.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { calculateCosts, round2 } from '@/lib/calculator'

const baseInput = {
  weightGrams: 100,
  printTimeMinutes: 120,
  setupMinutes: 15,
  postProcessingSteps: [],
  marginPercent: 30,
  discountPercent: 0,
  material: { pricePerKg: 300, failureRate: 0.03 },
  printer: { purchasePrice: 15000, powerWatts: 200, lifetimeHours: 2000, maintenanceUAH: 200, avgHoursPerMonth: 160 },
  user: { electricityRate: 4.32, hourlyRate: 150, overheadPerJob: 20 },
}

describe('round2', () => {
  it('rounds to 2 decimal places', () => {
    expect(round2(10.126)).toBe(10.13)
    expect(round2(10.124)).toBe(10.12)
    expect(round2(10.126)).toBe(10.13)
  })
})

describe('calculateCosts', () => {
  it('computes rawMaterialCost correctly', () => {
    const result = calculateCosts(baseInput)
    // 100g * (300 UAH/kg / 1000) = 30.00 UAH
    expect(result.rawMaterialCost).toBe(30.00)
  })

  it('computes failureCost correctly', () => {
    const result = calculateCosts(baseInput)
    // 30.00 * 0.03 = 0.90
    expect(result.failureCost).toBe(0.90)
  })

  it('computes machineCost correctly', () => {
    const result = calculateCosts(baseInput)
    // printHours = 2
    // depreciation = 15000/2000 = 7.5/h
    // maintenance = 200/160 = 1.25/h
    // electricity = (200/1000)*4.32 = 0.864/h
    // machineRate = 9.614/h => 2h = 19.23 (rounded)
    expect(result.machineCost).toBe(19.23)
  })

  it('computes laborCost for setup only (no postprocessing)', () => {
    const result = calculateCosts(baseInput)
    // 15min / 60 * 150 = 37.50
    expect(result.laborCost).toBe(37.50)
  })

  it('includes postprocessing time and material in costs', () => {
    const input = {
      ...baseInput,
      postProcessingSteps: [
        { timeMinutes: 30, materialCost: 10 },
      ],
    }
    const result = calculateCosts(input)
    // labor: (15+30)/60 * 150 = 112.50
    expect(result.laborCost).toBe(112.50)
    expect(result.postProcMaterialCost).toBe(10)
  })

  it('computes totalCost as sum of rounded components', () => {
    const result = calculateCosts(baseInput)
    const expected = round2(
      result.rawMaterialCost +
      result.failureCost +
      result.machineCost +
      result.laborCost +
      result.postProcMaterialCost +
      result.overheadCost
    )
    expect(result.totalCost).toBe(expected)
  })

  it('applies margin and discount to sellingPrice', () => {
    const input = { ...baseInput, marginPercent: 50, discountPercent: 10 }
    const result = calculateCosts(input)
    const afterMargin = result.totalCost * 1.5
    const expected = round2(afterMargin * 0.9)
    expect(result.sellingPrice).toBe(expected)
  })

  it('flags isBelowCost when discount makes sellingPrice < totalCost', () => {
    const input = { ...baseInput, marginPercent: 0, discountPercent: 50 }
    const result = calculateCosts(input)
    expect(result.isBelowCost).toBe(true)
    expect(result.sellingPrice).toBeLessThan(result.totalCost)
  })

  it('does not flag isBelowCost for normal pricing', () => {
    const result = calculateCosts(baseInput)
    expect(result.isBelowCost).toBe(false)
  })

  it('overheadCost equals user.overheadPerJob', () => {
    const result = calculateCosts(baseInput)
    expect(result.overheadCost).toBe(20)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- __tests__/lib/calculator.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/calculator'`

- [ ] **Step 3: Implement `lib/calculator.ts`**

```typescript
export interface CalculationInput {
  weightGrams: number
  printTimeMinutes: number
  setupMinutes: number
  postProcessingSteps: Array<{ timeMinutes: number; materialCost: number }>
  marginPercent: number
  discountPercent: number
  material: {
    pricePerKg: number
    failureRate: number
  }
  printer: {
    purchasePrice: number
    powerWatts: number
    lifetimeHours: number
    maintenanceUAH: number
    avgHoursPerMonth: number
  }
  user: {
    electricityRate: number
    hourlyRate: number
    overheadPerJob: number
  }
}

export interface CostBreakdown {
  rawMaterialCost: number
  failureCost: number
  machineCost: number
  laborCost: number
  postProcMaterialCost: number
  overheadCost: number
  totalCost: number
  sellingPrice: number
  isBelowCost: boolean
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function calculateCosts(input: CalculationInput): CostBreakdown {
  const printHours = input.printTimeMinutes / 60

  const rawMaterialCost = round2(input.weightGrams * (input.material.pricePerKg / 1000))
  const failureCost     = round2(rawMaterialCost * input.material.failureRate)

  const depreciationPerHour = input.printer.purchasePrice / input.printer.lifetimeHours
  const maintenancePerHour  = input.printer.maintenanceUAH / input.printer.avgHoursPerMonth
  const electricityPerHour  = (input.printer.powerWatts / 1000) * input.user.electricityRate
  const machineCost = round2(printHours * (depreciationPerHour + maintenancePerHour + electricityPerHour))

  // Labor covers setup + post-processing time only. Print time excluded:
  // the operator is not assumed to be actively present during printing.
  const postProcMinutes = input.postProcessingSteps.reduce((s, x) => s + x.timeMinutes, 0)
  const laborCost = round2(((input.setupMinutes + postProcMinutes) / 60) * input.user.hourlyRate)

  const postProcMaterialCost = round2(input.postProcessingSteps.reduce((s, x) => s + x.materialCost, 0))
  const overheadCost = round2(input.user.overheadPerJob)

  const totalCost = round2(rawMaterialCost + failureCost + machineCost + laborCost + postProcMaterialCost + overheadCost)

  const afterMargin  = totalCost * (1 + input.marginPercent / 100)
  const sellingPrice = round2(afterMargin * (1 - input.discountPercent / 100))

  return {
    rawMaterialCost,
    failureCost,
    machineCost,
    laborCost,
    postProcMaterialCost,
    overheadCost,
    totalCost,
    sellingPrice,
    isBelowCost: sellingPrice < totalCost,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test:run -- __tests__/lib/calculator.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/calculator.ts __tests__/lib/calculator.test.ts vitest.config.ts vitest.setup.ts
git commit -m "feat: implement and test core calculation logic"
```

---

### Task 4: Auth setup (NextAuth + middleware)

**Files:**
- Create: `lib/auth.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`
- Create: `middleware.ts`

- [ ] **Step 1: Create `lib/auth.ts`**

```typescript
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 }, // 30 days
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Пароль', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findUnique({ where: { email: credentials.email } })
        if (!user) return null
        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null
        return { id: user.id, email: user.email, name: user.name }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (session.user) session.user.id = token.id as string
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
}
```

- [ ] **Step 2: Create `app/api/auth/[...nextauth]/route.ts`**

```typescript
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

- [ ] **Step 3: Extend NextAuth types — create `types/next-auth.d.ts`**

```typescript
import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: { id: string; name: string; email: string }
  }
}

declare module 'next-auth/jwt' {
  interface JWT { id: string }
}
```

- [ ] **Step 4: Create `middleware.ts`**

```typescript
export { default } from 'next-auth/middleware'

export const config = {
  matcher: ['/dashboard/:path*', '/calculator/:path*', '/calculations/:path*', '/materials/:path*', '/printers/:path*', '/settings/:path*'],
}
```

- [ ] **Step 5: Commit**

```bash
git add lib/auth.ts app/api/auth middleware.ts types/
git commit -m "feat: add NextAuth credentials auth and route protection"
```

---

## Phase 2 — Auth Pages

### Task 5: Register and Login pages

**Files:**
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/register/page.tsx`
- Create: `app/api/auth/register/route.ts`
- Create: `app/(auth)/layout.tsx`

- [ ] **Step 1: Create auth layout `app/(auth)/layout.tsx`**

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
```

- [ ] **Step 2: Create register API route `app/api/auth/register/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const { name, businessName, email, password } = await req.json()

  if (!name || !email || !password || password.length < 8) {
    return NextResponse.json({ error: 'Невірні дані' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email вже використовується' }, { status: 409 })
  }

  const hashed = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { name, businessName, email, password: hashed },
  })

  return NextResponse.json({ id: user.id }, { status: 201 })
}
```

- [ ] **Step 3: Create `app/(auth)/register/page.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    const data = Object.fromEntries(fd)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const body = await res.json()
      setError(body.error || 'Помилка реєстрації')
      setLoading(false)
      return
    }

    await signIn('credentials', { email: data.email, password: data.password, redirect: false })
    router.push('/dashboard')
  }

  return (
    <Card>
      <CardHeader><CardTitle>Реєстрація</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div><Label>Ім'я</Label><Input name="name" required /></div>
          <div><Label>Назва бізнесу (необов'язково)</Label><Input name="businessName" /></div>
          <div><Label>Email</Label><Input name="email" type="email" required /></div>
          <div><Label>Пароль (мін. 8 символів)</Label><Input name="password" type="password" minLength={8} required /></div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Реєстрація...' : 'Зареєструватись'}
          </Button>
          <p className="text-sm text-center">
            Вже маєте акаунт? <Link href="/login" className="underline">Увійти</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 4: Create `app/(auth)/login/page.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    const result = await signIn('credentials', {
      email: fd.get('email'),
      password: fd.get('password'),
      redirect: false,
    })
    if (result?.error) {
      setError('Невірний email або пароль')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Вхід</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div><Label>Email</Label><Input name="email" type="email" required /></div>
          <div><Label>Пароль</Label><Input name="password" type="password" required /></div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Вхід...' : 'Увійти'}
          </Button>
          <p className="text-sm text-center">
            Немає акаунту? <Link href="/register" className="underline">Зареєструватись</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 5: Wrap app in SessionProvider — update `app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SessionProvider } from '@/components/session-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = { title: '3D Print Calculator' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body className={inter.className}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 6: Create `components/session-provider.tsx`**

```tsx
'use client'
import { SessionProvider as NextSessionProvider } from 'next-auth/react'

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextSessionProvider>{children}</NextSessionProvider>
}
```

- [ ] **Step 7: Manual test — start dev server**

```bash
npm run dev
```

Open http://localhost:3000/register, register a new account.
Verify redirect to /dashboard (will 404 for now — expected).
Open http://localhost:3000/login, log in with same credentials.
Open http://localhost:3000/materials (protected) — verify redirect to /login.

- [ ] **Step 8: Commit**

```bash
git add app/ components/session-provider.tsx
git commit -m "feat: add register and login pages with auth flow"
```

---

## Phase 3 — Dashboard Layout

### Task 6: Sidebar and navigation layout

**Files:**
- Create: `app/(dashboard)/layout.tsx`
- Create: `components/layout/sidebar.tsx`
- Create: `components/layout/top-nav.tsx`

- [ ] **Step 1: Create `components/layout/sidebar.tsx`**

```tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Calculator, List, Palette, Printer, Settings } from 'lucide-react'

const links = [
  { href: '/dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/calculator', label: 'Калькулятор', icon: Calculator },
  { href: '/calculations', label: 'Розрахунки', icon: List },
  { href: '/materials', label: 'Матеріали', icon: Palette },
  { href: '/printers', label: 'Принтери', icon: Printer },
  { href: '/settings', label: 'Налаштування', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-56 shrink-0 border-r bg-white h-screen sticky top-0 flex flex-col">
      <div className="p-4 border-b font-bold text-lg">🖨️ PrintCalc</div>
      <nav className="flex-1 p-2 space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              pathname.startsWith(href) && href !== '/dashboard'
                ? 'bg-slate-100 font-medium'
                : pathname === href
                ? 'bg-slate-100 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 2: Create `components/layout/top-nav.tsx`**

```tsx
'use client'
import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'

export function TopNav() {
  const { data: session } = useSession()
  return (
    <header className="h-14 border-b bg-white flex items-center justify-end px-6 gap-4">
      <span className="text-sm text-gray-600">{session?.user?.name}</span>
      <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: '/login' })}>
        Вийти
      </Button>
    </header>
  )
}
```

- [ ] **Step 3: Create `app/(dashboard)/layout.tsx`**

```tsx
import { Sidebar } from '@/components/layout/sidebar'
import { TopNav } from '@/components/layout/top-nav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">{children}</main>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create placeholder `app/(dashboard)/dashboard/page.tsx`**

```tsx
export default function DashboardPage() {
  return <div><h1 className="text-2xl font-bold">Дашборд</h1></div>
}
```

- [ ] **Step 5: Manual test**

Open http://localhost:3000/dashboard after login. Verify sidebar renders with all links, top nav shows username, sign-out works.

- [ ] **Step 6: Commit**

```bash
git add app/(dashboard)/ components/layout/
git commit -m "feat: add dashboard layout with sidebar navigation"
```

---

## Phase 4 — Settings

### Task 7: Settings page

**Files:**
- Create: `app/(dashboard)/settings/page.tsx`
- Create: `app/api/settings/route.ts`

- [ ] **Step 1: Create settings API `app/api/settings/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, businessName: true, hourlyRate: true, electricityRate: true, overheadPerJob: true, defaultMarginPercent: true },
  })
  return NextResponse.json(user)
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { currentPassword, newPassword, ...fields } = body

  if (newPassword) {
    if (!currentPassword) return NextResponse.json({ error: 'Потрібен поточний пароль' }, { status: 400 })
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) return NextResponse.json({ error: 'Поточний пароль невірний' }, { status: 400 })
    fields.password = await bcrypt.hash(newPassword, 12)
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: fields,
    select: { name: true, email: true, businessName: true, hourlyRate: true, electricityRate: true, overheadPerJob: true, defaultMarginPercent: true },
  })
  return NextResponse.json(updated)
}
```

- [ ] **Step 2: Create `app/(dashboard)/settings/page.tsx`**

```tsx
'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

type Settings = {
  name: string; email: string; businessName: string
  hourlyRate: number; electricityRate: number; overheadPerJob: number; defaultMarginPercent: number
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' })

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(setSettings)
  }, [])

  async function save(data: Partial<Settings>) {
    setSaving(true); setMessage('')
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const updated = await res.json()
      setSettings(prev => ({ ...prev!, ...updated }))
      setMessage('Збережено')
    } else {
      const err = await res.json()
      setMessage(err.error || 'Помилка')
    }
    setSaving(false)
  }

  if (!settings) return <div>Завантаження...</div>

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Налаштування</h1>

      <Card>
        <CardHeader><CardTitle>Профіль</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Ім'я</Label><Input value={settings.name} onChange={e => setSettings(s => s && ({ ...s, name: e.target.value }))} /></div>
          <div><Label>Назва бізнесу</Label><Input value={settings.businessName || ''} onChange={e => setSettings(s => s && ({ ...s, businessName: e.target.value }))} /></div>
          <div><Label>Email</Label><Input value={settings.email} onChange={e => setSettings(s => s && ({ ...s, email: e.target.value }))} /></div>
          <Button onClick={() => save({ name: settings.name, businessName: settings.businessName, email: settings.email })} disabled={saving}>Зберегти</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Тарифи</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Вартість електроенергії (₴/кВт·г)</Label><Input type="number" step="0.01" value={settings.electricityRate} onChange={e => setSettings(s => s && ({ ...s, electricityRate: +e.target.value }))} /></div>
          <div><Label>Ставка праці (₴/год)</Label><Input type="number" step="1" value={settings.hourlyRate} onChange={e => setSettings(s => s && ({ ...s, hourlyRate: +e.target.value }))} /></div>
          <div><Label>Накладні витрати на замовлення (₴)</Label><Input type="number" step="1" value={settings.overheadPerJob} onChange={e => setSettings(s => s && ({ ...s, overheadPerJob: +e.target.value }))} /></div>
          <div><Label>Стандартна маржа (%)</Label><Input type="number" step="1" value={settings.defaultMarginPercent} onChange={e => setSettings(s => s && ({ ...s, defaultMarginPercent: +e.target.value }))} /></div>
          <Button onClick={() => save({ electricityRate: settings.electricityRate, hourlyRate: settings.hourlyRate, overheadPerJob: settings.overheadPerJob, defaultMarginPercent: settings.defaultMarginPercent })} disabled={saving}>Зберегти</Button>
          {message && <p className="text-sm text-green-600">{message}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Зміна пароля</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Поточний пароль</Label><Input type="password" value={pwForm.currentPassword} onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} /></div>
          <div><Label>Новий пароль</Label><Input type="password" value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} /></div>
          <Button onClick={() => save(pwForm)} disabled={saving}>Змінити пароль</Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Manual test** — Navigate to /settings, update electricity rate, save. Verify it persists after page reload.

- [ ] **Step 4: Commit**

```bash
git add app/(dashboard)/settings/ app/api/settings/
git commit -m "feat: add settings page with tariff and password management"
```

---

## Phase 5 — Materials

### Task 8: Materials API

**Files:**
- Create: `app/api/materials/route.ts`
- Create: `app/api/materials/[id]/route.ts`
- Create: `app/api/materials/[id]/purchases/route.ts`

- [ ] **Step 1: Create `app/api/materials/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const materials = await prisma.material.findMany({
    where: { userId: session.user.id },
    include: { purchases: { orderBy: { date: 'desc' }, take: 10 } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(materials)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const material = await prisma.material.create({
    data: { ...body, userId: session.user.id },
  })
  return NextResponse.json(material, { status: 201 })
}
```

- [ ] **Step 2: Create `app/api/materials/[id]/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function owned(id: string, userId: string) {
  return prisma.material.findFirst({ where: { id, userId } })
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const material = await owned(params.id, session.user.id)
  if (!material) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(material)
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const existing = await owned(params.id, session.user.id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await req.json()
  const updated = await prisma.material.update({ where: { id: params.id }, data: body })
  return NextResponse.json(updated)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const existing = await owned(params.id, session.user.id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  try {
    await prisma.material.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Матеріал використовується в розрахунках' }, { status: 409 })
  }
}
```

- [ ] **Step 3: Create `app/api/materials/[id]/purchases/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const material = await prisma.material.findFirst({ where: { id: params.id, userId: session.user.id } })
  if (!material) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const purchases = await prisma.materialPurchase.findMany({
    where: { materialId: params.id },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(purchases)
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const material = await prisma.material.findFirst({ where: { id: params.id, userId: session.user.id } })
  if (!material) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await req.json()
  const purchase = await prisma.materialPurchase.create({
    data: { ...body, materialId: params.id, userId: session.user.id, date: new Date(body.date) },
  })
  // Update material's current price to latest purchase price
  await prisma.material.update({ where: { id: params.id }, data: { pricePerKg: body.pricePerKg } })
  return NextResponse.json(purchase, { status: 201 })
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/materials/
git commit -m "feat: add materials CRUD and purchase log API"
```

---

### Task 9: Materials page UI

**Files:**
- Create: `app/(dashboard)/materials/page.tsx`
- Create: `components/materials/material-card.tsx`
- Create: `components/materials/material-form.tsx`
- Create: `components/materials/material-filters.tsx`

- [ ] **Step 1: Create `components/materials/material-card.tsx`**

```tsx
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Pencil, Trash2 } from 'lucide-react'

type Material = {
  id: string; name: string; brand: string; type: string
  color: string; colorHex: string; pricePerKg: number; inStock: boolean
}

export function MaterialCard({ material, onEdit, onDelete }: { material: Material; onEdit: () => void; onDelete: () => void }) {
  return (
    <Card className={material.inStock ? '' : 'opacity-50'}>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="w-8 h-8 rounded-full border flex-shrink-0" style={{ background: material.colorHex }} title={material.color} />
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{material.name}</div>
          <div className="text-sm text-gray-500">{material.brand} · {material.color}</div>
        </div>
        <Badge variant="outline">{material.type}</Badge>
        <div className="text-sm font-medium whitespace-nowrap">₴{material.pricePerKg}/кг</div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={onEdit}><Pencil className="w-4 h-4" /></Button>
          <Button size="icon" variant="ghost" onClick={onDelete}><Trash2 className="w-4 h-4 text-red-400" /></Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Create `components/materials/material-form.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const TYPES = ['PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'PA', 'PC', 'OTHER']

type MaterialData = {
  name: string; brand: string; type: string; color: string; colorHex: string
  pricePerKg: number; density: number; failureRate: number; notes: string; inStock: boolean
}

export function MaterialForm({ initial, onSave, onCancel }: { initial?: Partial<MaterialData>; onSave: (data: MaterialData) => void; onCancel: () => void }) {
  const [form, setForm] = useState<MaterialData>({
    name: '', brand: '', type: 'PLA', color: '', colorHex: '#888888',
    pricePerKg: 300, density: 1.24, failureRate: 3, notes: '', inStock: true,
    ...initial,
  })

  function set(key: keyof MaterialData, value: string | number | boolean) {
    setForm(f => ({ ...f, [key]: value }))
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Назва *</Label><Input value={form.name} onChange={e => set('name', e.target.value)} /></div>
        <div><Label>Бренд *</Label><Input value={form.brand} onChange={e => set('brand', e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Тип *</Label>
          <Select value={form.type} onValueChange={v => set('type', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Колір</Label>
          <div className="flex gap-2">
            <Input value={form.color} onChange={e => set('color', e.target.value)} placeholder="Чорний" />
            <input type="color" value={form.colorHex} onChange={e => set('colorHex', e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div><Label>Ціна (₴/кг) *</Label><Input type="number" value={form.pricePerKg} onChange={e => set('pricePerKg', +e.target.value)} /></div>
        <div><Label>Щільність (г/см³)</Label><Input type="number" step="0.01" value={form.density} onChange={e => set('density', +e.target.value)} /></div>
        <div><Label>Брак (%)</Label><Input type="number" step="0.1" value={form.failureRate} onChange={e => set('failureRate', +e.target.value)} /></div>
      </div>
      <div><Label>Нотатки</Label><Input value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>Скасувати</Button>
        <Button onClick={() => onSave({ ...form, failureRate: form.failureRate / 100 })}>Зберегти</Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `app/(dashboard)/materials/page.tsx`**

```tsx
'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MaterialCard } from '@/components/materials/material-card'
import { MaterialForm } from '@/components/materials/material-form'
import { Plus } from 'lucide-react'

const TYPES = ['Всі', 'PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'PA', 'PC', 'OTHER']

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<any[]>([])
  const [editing, setEditing] = useState<any | null>(null)
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('Всі')

  async function load() {
    const res = await fetch('/api/materials')
    setMaterials(await res.json())
  }

  useEffect(() => { load() }, [])

  async function handleSave(data: any) {
    if (editing) {
      await fetch(`/api/materials/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    } else {
      await fetch('/api/materials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    }
    setEditing(null); setCreating(false); load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Видалити матеріал?')) return
    const res = await fetch(`/api/materials/${id}`, { method: 'DELETE' })
    if (!res.ok) { const e = await res.json(); alert(e.error) } else { load() }
  }

  const filtered = materials.filter(m =>
    (typeFilter === 'Всі' || m.type === typeFilter) &&
    (m.name.toLowerCase().includes(search.toLowerCase()) || m.brand.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Матеріали</h1>
        <Button onClick={() => setCreating(true)}><Plus className="w-4 h-4 mr-2" />Додати</Button>
      </div>
      <div className="flex gap-4">
        <Input placeholder="Пошук..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        {filtered.map(m => (
          <MaterialCard key={m.id} material={m} onEdit={() => setEditing(m)} onDelete={() => handleDelete(m.id)} />
        ))}
        {filtered.length === 0 && <p className="text-gray-400 text-center py-8">Матеріалів не знайдено</p>}
      </div>

      <Dialog open={creating || !!editing} onOpenChange={open => { if (!open) { setCreating(false); setEditing(null) } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Редагувати матеріал' : 'Новий матеріал'}</DialogTitle></DialogHeader>
          <MaterialForm initial={editing ? { ...editing, failureRate: editing.failureRate * 100 } : undefined} onSave={handleSave} onCancel={() => { setCreating(false); setEditing(null) }} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

- [ ] **Step 4: Manual test** — Add PLA material, edit it, delete it. Verify filters work.

- [ ] **Step 5: Commit**

```bash
git add app/(dashboard)/materials/ app/api/materials/ components/materials/
git commit -m "feat: add materials management with CRUD and filters"
```

---

## Phase 6 — Printers

### Task 10: Printers API and UI

**Files:**
- Create: `app/api/printers/route.ts`
- Create: `app/api/printers/[id]/route.ts`
- Create: `app/(dashboard)/printers/page.tsx`
- Create: `app/(dashboard)/printers/[id]/page.tsx`
- Create: `components/printers/printer-card.tsx`
- Create: `components/printers/printer-form.tsx`
- Create: `components/printers/roi-calculator.tsx`

- [ ] **Step 1: Create `app/api/printers/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const printers = await prisma.printer.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(printers)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const printer = await prisma.printer.create({ data: { ...body, userId: session.user.id } })
  return NextResponse.json(printer, { status: 201 })
}
```

- [ ] **Step 2: Create `app/api/printers/[id]/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function owned(id: string, userId: string) {
  return prisma.printer.findFirst({ where: { id, userId } })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await owned(params.id, session.user.id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await req.json()
  const updated = await prisma.printer.update({ where: { id: params.id }, data: body })
  return NextResponse.json(updated)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await owned(params.id, session.user.id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  try {
    await prisma.printer.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Принтер використовується в розрахунках' }, { status: 409 })
  }
}
```

- [ ] **Step 3: Create `components/printers/printer-form.tsx`** — similar pattern to MaterialForm with fields: name, brand, purchasePrice, powerWatts, lifetimeHours, maintenanceUAH, avgHoursPerMonth, notes.

```tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type PrinterData = { name: string; brand: string; purchasePrice: number; powerWatts: number; lifetimeHours: number; maintenanceUAH: number; avgHoursPerMonth: number; notes: string }

export function PrinterForm({ initial, onSave, onCancel }: { initial?: Partial<PrinterData>; onSave: (d: PrinterData) => void; onCancel: () => void }) {
  const [form, setForm] = useState<PrinterData>({ name: '', brand: '', purchasePrice: 0, powerWatts: 200, lifetimeHours: 2000, maintenanceUAH: 200, avgHoursPerMonth: 160, notes: '', ...initial })
  const set = (k: keyof PrinterData, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Назва *</Label><Input value={form.name} onChange={e => set('name', e.target.value)} /></div>
        <div><Label>Бренд</Label><Input value={form.brand} onChange={e => set('brand', e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Ціна покупки (₴) *</Label><Input type="number" value={form.purchasePrice} onChange={e => set('purchasePrice', +e.target.value)} /></div>
        <div><Label>Споживання (Вт) *</Label><Input type="number" value={form.powerWatts} onChange={e => set('powerWatts', +e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div><Label>Ресурс (год)</Label><Input type="number" value={form.lifetimeHours} onChange={e => set('lifetimeHours', +e.target.value)} /></div>
        <div><Label>Обслуговування (₴/міс)</Label><Input type="number" value={form.maintenanceUAH} onChange={e => set('maintenanceUAH', +e.target.value)} /></div>
        <div><Label>Середнє завант. (год/міс)</Label><Input type="number" value={form.avgHoursPerMonth} onChange={e => set('avgHoursPerMonth', +e.target.value)} /></div>
      </div>
      <div><Label>Нотатки</Label><Input value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>Скасувати</Button>
        <Button onClick={() => onSave(form)}>Зберегти</Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `components/printers/roi-calculator.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Printer = { purchasePrice: number; powerWatts: number; lifetimeHours: number; maintenanceUAH: number; avgHoursPerMonth: number }

export function RoiCalculator({ printer, electricityRate }: { printer: Printer; electricityRate: number }) {
  const [avgRevPerHour, setAvgRevPerHour] = useState(50)

  const depPerHour = printer.purchasePrice / printer.lifetimeHours
  const maintPerHour = printer.maintenanceUAH / printer.avgHoursPerMonth
  const elecPerHour = (printer.powerWatts / 1000) * electricityRate
  const costPerHour = depPerHour + maintPerHour + elecPerHour
  const profitPerHour = avgRevPerHour - costPerHour
  const monthlyProfit = profitPerHour * printer.avgHoursPerMonth
  const breakEvenMonths = monthlyProfit > 0 ? Math.ceil(printer.purchasePrice / monthlyProfit) : null

  return (
    <Card>
      <CardHeader><CardTitle>Окупність принтера</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Середній дохід за годину друку (₴)</Label>
          <Input type="number" value={avgRevPerHour} onChange={e => setAvgRevPerHour(+e.target.value)} className="max-w-xs" />
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-gray-600">Вартість год. роботи:</div><div className="font-medium">₴{costPerHour.toFixed(2)}</div>
          <div className="text-gray-600">Прибуток за год.:</div><div className="font-medium">₴{profitPerHour.toFixed(2)}</div>
          <div className="text-gray-600">Прибуток на місяць:</div><div className="font-medium">₴{monthlyProfit.toFixed(0)}</div>
          <div className="text-gray-600">Окупність:</div>
          <div className="font-bold text-lg">{breakEvenMonths ? `${breakEvenMonths} міс.` : '—'}</div>
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 5: Create `components/printers/printer-card.tsx`**

```tsx
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export function PrinterCard({ printer, costPerHour, onEdit, onDelete }: { printer: any; costPerHour: number; onEdit: () => void; onDelete: () => void }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="flex-1">
          <div className="font-medium">{printer.name}</div>
          <div className="text-sm text-gray-500">{printer.brand} · {printer.powerWatts}Вт</div>
        </div>
        <div className="text-sm text-center">
          <div className="text-gray-500">Вартість/год</div>
          <div className="font-bold">₴{costPerHour.toFixed(2)}</div>
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" asChild><Link href={`/printers/${printer.id}`}><ExternalLink className="w-4 h-4" /></Link></Button>
          <Button size="icon" variant="ghost" onClick={onEdit}><Pencil className="w-4 h-4" /></Button>
          <Button size="icon" variant="ghost" onClick={onDelete}><Trash2 className="w-4 h-4 text-red-400" /></Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 6: Create `app/(dashboard)/printers/page.tsx`**

Follow the same structure as `materials/page.tsx`: fetch from `GET /api/printers`, render `PrinterCard` list, add/edit dialog with `PrinterForm`. For each printer, compute `costPerHour = purchasePrice/lifetimeHours + maintenanceUAH/avgHoursPerMonth + (powerWatts/1000)*electricityRate` (fetch `electricityRate` from `GET /api/settings`).

- [ ] **Step 7: Create `app/(dashboard)/printers/[id]/page.tsx`**

```tsx
// Fetch printer and user settings, render detail + ROI
export default async function PrinterDetailPage({ params }: { params: { id: string } }) {
  // Server component: fetch both in parallel
  const [printerRes, settingsRes] = await Promise.all([
    fetch(`${process.env.NEXTAUTH_URL}/api/printers/${params.id}`, { ... }),
    fetch(`${process.env.NEXTAUTH_URL}/api/settings`, { ... }),
  ])
  const printer = await printerRes.json()
  const settings = await settingsRes.json()
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">{printer.name}</h1>
      {/* printer details grid */}
      <RoiCalculator printer={printer} electricityRate={settings.electricityRate} />
    </div>
  )
}
```

Note: since this is a server component, pass cookies/auth headers when fetching internal API routes. Alternatively, call Prisma and `getServerSession` directly instead of going through the API.

- [ ] **Step 8: Manual test** — Add printer, view detail, verify ROI calculation updates live.

- [ ] **Step 9: Commit**

```bash
git add app/(dashboard)/printers/ app/api/printers/ components/printers/
git commit -m "feat: add printer management with ROI calculator"
```

---

## Phase 7 — Calculator

### Task 11: Calculator API

**Files:**
- Create: `app/api/calculations/route.ts`
- Create: `app/api/calculations/[id]/route.ts`
- Create: `app/api/calculations/[id]/duplicate/route.ts`

- [ ] **Step 1: Create `app/api/calculations/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 20
  const [total, items] = await Promise.all([
    prisma.calculation.count({ where: { userId: session.user.id } }),
    prisma.calculation.findMany({
      where: { userId: session.user.id },
      include: { material: true, printer: true, postProcessingSteps: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])
  return NextResponse.json({ items, total, page, pages: Math.ceil(total / limit) })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { postProcessingSteps, ...rest } = body
  const calc = await prisma.calculation.create({
    data: {
      ...rest,
      userId: session.user.id,
      postProcessingSteps: postProcessingSteps?.length
        ? { create: postProcessingSteps }
        : undefined,
    },
    include: { postProcessingSteps: true },
  })
  return NextResponse.json(calc, { status: 201 })
}
```

- [ ] **Step 2: Create `app/api/calculations/[id]/route.ts`** — GET (single), PATCH, DELETE with ownership checks (same pattern as materials).

  **Important:** The PATCH handler must handle a special `generateQuote` flag (added in Task 15). Add this block at the start of the PATCH body processing:

  ```typescript
  if (body.generateQuote) {
    const { randomBytes } = await import('crypto')
    body.quoteToken = randomBytes(32).toString('hex')
    body.quoteExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    body.status = 'QUOTED'
    delete body.generateQuote
  }
  ```

  Write this now so Task 15 can reference it without a back-edit.

- [ ] **Step 3: Create `app/api/calculations/[id]/duplicate/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const original = await prisma.calculation.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: { postProcessingSteps: true },
  })
  if (!original) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { id, createdAt, updatedAt, quoteToken, quoteExpiresAt, quoteApprovedAt, clientName, photoUrl, ...fields } = original
  const { postProcessingSteps, ...calcFields } = fields

  const duplicate = await prisma.calculation.create({
    data: {
      ...calcFields,
      name: `${calcFields.name} (копія)`,
      status: 'DRAFT',
      postProcessingSteps: {
        create: postProcessingSteps.map(({ id, calculationId, ...step }) => step),
      },
    },
    include: { postProcessingSteps: true },
  })
  return NextResponse.json(duplicate, { status: 201 })
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/calculations/
git commit -m "feat: add calculations CRUD and duplicate API"
```

---

### Task 12: Calculator UI

**Files:**
- Create: `components/calculator/cost-breakdown-panel.tsx`
- Create: `components/calculator/step-setup.tsx`
- Create: `components/calculator/step-parameters.tsx`
- Create: `components/calculator/step-postprocessing.tsx`
- Create: `components/calculator/step-pricing.tsx`
- Create: `components/calculator/calculator-form.tsx`
- Create: `app/(dashboard)/calculator/page.tsx`
- Create: `app/(dashboard)/calculator/[id]/page.tsx`

- [ ] **Step 1: Create `components/calculator/cost-breakdown-panel.tsx`**

```tsx
'use client'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { CostBreakdown } from '@/lib/calculator'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ef4444', '#8b5cf6']
const LABELS: Record<string, string> = {
  rawMaterialCost: 'Матеріал', failureCost: 'Брак', machineCost: 'Принтер',
  laborCost: 'Праця', postProcMaterialCost: 'Постобробка', overheadCost: 'Накладні',
}

export function CostBreakdownPanel({ breakdown }: { breakdown: CostBreakdown | null }) {
  if (!breakdown) return <div className="text-gray-400 text-sm text-center py-8">Заповніть параметри</div>

  const data = Object.entries(LABELS)
    .map(([key, name]) => ({ name, value: breakdown[key as keyof CostBreakdown] as number }))
    .filter(d => d.value > 0)

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={50} outerRadius={80}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v: number) => `₴${v.toFixed(2)}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      <div className="space-y-1 text-sm">
        {data.map((d, i) => (
          <div key={d.name} className="flex justify-between">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: COLORS[i % COLORS.length] }} />
              {d.name}
            </span>
            <span>₴{d.value.toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t pt-1 flex justify-between font-medium">
          <span>Собівартість</span><span>₴{breakdown.totalCost.toFixed(2)}</span>
        </div>
        <div className={`flex justify-between font-bold text-base ${breakdown.isBelowCost ? 'text-red-500' : 'text-green-600'}`}>
          <span>Ціна продажу</span><span>₴{breakdown.sellingPrice.toFixed(2)}</span>
        </div>
        {breakdown.isBelowCost && (
          <p className="text-red-500 text-xs">⚠️ Ціна продажу нижча за собівартість</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create step components** — each step is a controlled form section that calls `onChange` when values change. Below is Step 1 as reference; implement Steps 2-4 similarly.

`components/calculator/step-setup.tsx`:

```tsx
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function StepSetup({ form, onChange, printers, materials }: { form: any; onChange: (k: string, v: any) => void; printers: any[]; materials: any[] }) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Назва виробу *</Label>
        <Input value={form.name} onChange={e => onChange('name', e.target.value)} placeholder="Наприклад: Кронштейн камери" />
      </div>
      <div>
        <Label>Принтер</Label>
        <Select value={form.printerId || ''} onValueChange={v => onChange('printerId', v)}>
          <SelectTrigger><SelectValue placeholder="Оберіть принтер" /></SelectTrigger>
          <SelectContent>
            {printers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Матеріал</Label>
        <Select value={form.materialId || ''} onValueChange={v => onChange('materialId', v)}>
          <SelectTrigger><SelectValue placeholder="Оберіть матеріал" /></SelectTrigger>
          <SelectContent>
            {materials.map(m => (
              <SelectItem key={m.id} value={m.id}>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ background: m.colorHex }} />
                  {m.name} ({m.brand})
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Час підготовки (хв)</Label>
        <Input type="number" value={form.setupMinutes} onChange={e => onChange('setupMinutes', +e.target.value)} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `components/calculator/calculator-form.tsx`** — orchestrates steps, maintains form state, calls `calculateCosts()` on every change, shows `CostBreakdownPanel` on the right. On save, POSTs to `/api/calculations`.

- [ ] **Step 4: Create `app/(dashboard)/calculator/page.tsx`** — loads printers/materials/user-settings, renders CalculatorForm

- [ ] **Step 5: Create `app/(dashboard)/calculator/[id]/page.tsx`** — loads existing calculation, renders CalculatorForm pre-filled

- [ ] **Step 6: Manual test** — Create a calculation end-to-end. Verify breakdown panel updates live, below-cost warning triggers, save redirects to /calculations.

- [ ] **Step 7: Commit**

```bash
git add app/(dashboard)/calculator/ components/calculator/
git commit -m "feat: add multi-step calculator with live cost breakdown"
```

---

## Phase 8 — Calculations Library

### Task 13: Calculations library page

**Files:**
- Create: `app/(dashboard)/calculations/page.tsx`
- Create: `components/calculations/calculations-table.tsx`

- [ ] **Step 1: Create `components/calculations/calculations-table.tsx`**

Table with columns: thumbnail, name, material, printer, totalCost, sellingPrice, status badge, date. Actions: view (link to /calculator/[id]), duplicate (POST to duplicate endpoint), delete (DELETE).

- [ ] **Step 2: Create `app/(dashboard)/calculations/page.tsx`**

```tsx
'use client'
import { useEffect, useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { CalculationsTable } from '@/components/calculations/calculations-table'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default function CalculationsPage() {
  const [data, setData] = useState<{ items: any[]; total: number; pages: number } | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    const res = await fetch(`/api/calculations?page=${page}`)
    setData(await res.json())
  }, [page])

  useEffect(() => { load() }, [load])

  async function handleDuplicate(id: string) {
    await fetch(`/api/calculations/${id}/duplicate`, { method: 'POST' })
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Видалити розрахунок?')) return
    await fetch(`/api/calculations/${id}`, { method: 'DELETE' })
    load()
  }

  const filtered = data?.items.filter(c => c.name.toLowerCase().includes(search.toLowerCase())) ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Розрахунки</h1>
        <Button asChild><Link href="/calculator"><Plus className="w-4 h-4 mr-2" />Новий</Link></Button>
      </div>
      <Input placeholder="Пошук за назвою..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
      <CalculationsTable items={filtered} onDuplicate={handleDuplicate} onDelete={handleDelete} />
      {data && data.pages > 1 && (
        <div className="flex gap-2 justify-center">
          {Array.from({ length: data.pages }, (_, i) => (
            <Button key={i} variant={page === i + 1 ? 'default' : 'outline'} size="sm" onClick={() => setPage(i + 1)}>{i + 1}</Button>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Manual test** — Create 3 calculations, verify table, duplicate one, delete one.

- [ ] **Step 4: Commit**

```bash
git add app/(dashboard)/calculations/ components/calculations/
git commit -m "feat: add calculations library with pagination and actions"
```

---

## Phase 9 — File Uploads

### Task 14: Upload API and photo/STL support

**Files:**
- Create: `lib/upload.ts`
- Create: `app/api/upload/route.ts`

- [ ] **Step 1: Create `lib/upload.ts`**

```typescript
import path from 'path'
import fs from 'fs/promises'
import { cuid } from '@paralleldrive/cuid2'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'
const MAX_MB = parseInt(process.env.MAX_UPLOAD_SIZE_MB || '50')
const ALLOWED_IMAGES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_STL = ['application/octet-stream', 'model/stl']

export async function saveUpload(file: File, type: 'photo' | 'stl'): Promise<string> {
  if (file.size > MAX_MB * 1024 * 1024) throw new Error(`Максимальний розмір файлу ${MAX_MB} МБ`)

  const allowed = type === 'photo' ? ALLOWED_IMAGES : ALLOWED_STL
  if (!allowed.includes(file.type) && !(type === 'stl' && file.name.toLowerCase().endsWith('.stl'))) {
    throw new Error('Невірний тип файлу')
  }

  const ext = type === 'photo' ? file.name.split('.').pop() || 'jpg' : 'stl'
  const filename = `${cuid()}.${ext}`
  const filepath = path.join(UPLOAD_DIR, filename)

  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  const buffer = Buffer.from(await file.arrayBuffer())
  await fs.writeFile(filepath, buffer)

  return `/uploads/${filename}`
}
```

- [ ] **Step 2: Install cuid2**

```bash
npm install @paralleldrive/cuid2
```

- [ ] **Step 3: Create `app/api/upload/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { saveUpload } from '@/lib/upload'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const type = formData.get('type') as 'photo' | 'stl'

  if (!file) return NextResponse.json({ error: 'Файл не знайдено' }, { status: 400 })

  try {
    const url = await saveUpload(file, type)
    return NextResponse.json({ url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
```

- [ ] **Step 4: Serve uploads — create an API route to stream files**

Next.js rewrites cannot serve arbitrary filesystem paths. Instead, create `app/api/uploads/[...path]/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

export async function GET(_: Request, { params }: { params: { path: string[] } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const filePath = path.join(process.env.UPLOAD_DIR || './uploads', ...params.path)
  // Prevent path traversal
  const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads')
  if (!path.resolve(filePath).startsWith(uploadDir)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!fs.existsSync(filePath)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const buffer = fs.readFileSync(filePath)
  const ext = path.extname(filePath).toLowerCase()
  const contentType = ext === '.stl' ? 'application/octet-stream' : ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg'
  return new NextResponse(buffer, { headers: { 'Content-Type': contentType } })
}
```

Store `photoUrl` as `/api/uploads/filename.jpg` in the DB. In production, Nginx can be configured to serve the Docker volume directly for better performance (optional optimization).

- [ ] **Step 5: Add photo upload button to calculator** — after saving a calculation, show file input that POSTs to `/api/upload?type=photo` and then PATCHes the calculation with `photoUrl`.

- [ ] **Step 6: Commit**

```bash
git add lib/upload.ts app/api/upload/
git commit -m "feat: add file upload API for photos and STL files"
```

---

## Phase 10 — Public Quote

### Task 15: Public quote page and approval

**Files:**
- Create: `app/api/quotes/[token]/route.ts`
- Create: `app/api/quotes/[token]/approve/route.ts`
- Create: `app/quote/[token]/page.tsx`
- Create: `components/quote/quote-card.tsx`

- [ ] **Step 1: Add quote token generation to calculation PATCH API** — when `generateQuote: true` is sent in PATCH body, generate token and set expiry:

```typescript
// inside PATCH handler in app/api/calculations/[id]/route.ts
if (body.generateQuote) {
  const { randomBytes } = await import('crypto')
  body.quoteToken = randomBytes(32).toString('hex')
  body.quoteExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  body.status = 'QUOTED'
  delete body.generateQuote
}
```

- [ ] **Step 2: Create `app/api/quotes/[token]/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: Request, { params }: { params: { token: string } }) {
  const calc = await prisma.calculation.findUnique({
    where: { quoteToken: params.token },
    include: { material: true, user: { select: { businessName: true, name: true } } },
  })
  if (!calc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (calc.quoteExpiresAt && calc.quoteExpiresAt < new Date()) {
    return NextResponse.json({ error: 'Expired' }, { status: 410 })
  }
  // Return only public fields
  return NextResponse.json({
    name: calc.name,
    photoUrl: calc.photoUrl,
    materialName: calc.material?.name,
    materialColor: calc.material?.color,
    materialColorHex: calc.material?.colorHex,
    printTimeMinutes: calc.printTimeMinutes,
    sellingPrice: calc.sellingPrice,
    discountPercent: calc.discountPercent,
    businessName: calc.user.businessName || calc.user.name,
    status: calc.status,
    isApproved: !!calc.quoteApprovedAt,
  })
}
```

- [ ] **Step 3: Create `app/api/quotes/[token]/approve/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(_: Request, { params }: { params: { token: string } }) {
  const calc = await prisma.calculation.findUnique({ where: { quoteToken: params.token } })
  if (!calc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (calc.quoteExpiresAt && calc.quoteExpiresAt < new Date()) {
    return NextResponse.json({ error: 'Expired' }, { status: 410 })
  }
  // Idempotent — if already approved, return 200 with no change
  if (calc.quoteApprovedAt) return NextResponse.json({ ok: true })
  await prisma.calculation.update({
    where: { id: calc.id },
    data: { quoteApprovedAt: new Date(), status: 'APPROVED' },
  })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: Create `components/quote/quote-card.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'

export function QuoteCard({ quote, token }: { quote: any; token: string }) {
  const [approved, setApproved] = useState(quote.isApproved)
  const [loading, setLoading] = useState(false)

  async function approve() {
    setLoading(true)
    await fetch(`/api/quotes/${token}/approve`, { method: 'POST' })
    setApproved(true)
    setLoading(false)
  }

  const hours = Math.floor(quote.printTimeMinutes / 60)
  const mins = quote.printTimeMinutes % 60

  return (
    <div className="max-w-lg mx-auto mt-16 rounded-2xl border shadow-lg overflow-hidden bg-white">
      {quote.photoUrl && (
        <div className="relative w-full h-64">
          <Image src={quote.photoUrl} alt={quote.name} fill className="object-cover" />
        </div>
      )}
      <div className="p-8 space-y-4">
        <div className="text-sm text-gray-500">{quote.businessName}</div>
        <h1 className="text-2xl font-bold">{quote.name}</h1>
        {quote.materialName && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="w-4 h-4 rounded-full border" style={{ background: quote.materialColorHex }} />
            {quote.materialName} · {quote.materialColor}
          </div>
        )}
        <div className="text-sm text-gray-600">
          Час друку: {hours > 0 ? `${hours} год ` : ''}{mins > 0 ? `${mins} хв` : ''}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold">₴{quote.sellingPrice.toFixed(2)}</span>
          {quote.discountPercent > 0 && <Badge className="bg-green-100 text-green-700">Знижка {quote.discountPercent}%</Badge>}
        </div>
        {approved ? (
          <div className="bg-green-50 text-green-700 rounded-lg p-4 text-center font-medium">✓ Замовлення підтверджено</div>
        ) : (
          <Button className="w-full" size="lg" onClick={approve} disabled={loading}>
            {loading ? 'Підтвердження...' : 'Підтвердити замовлення'}
          </Button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create `app/quote/[token]/page.tsx`**

```tsx
import { QuoteCard } from '@/components/quote/quote-card'

export default async function QuotePage({ params }: { params: { token: string } }) {
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/quotes/${params.token}`, { cache: 'no-store' })
  if (!res.ok) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-lg">Посилання недійсне або закінчився термін дії</p>
      </div>
    )
  }
  const quote = await res.json()
  return <main className="min-h-screen bg-gray-50"><QuoteCard quote={quote} token={params.token} /></main>
}
```

- [ ] **Step 6: Manual test** — Create calculation, generate quote link, open link in incognito (no login). Verify quote renders, approve button works, second click is no-op.

- [ ] **Step 7: Commit**

```bash
git add app/api/quotes/ app/quote/ components/quote/
git commit -m "feat: add public client quote page with approval"
```

---

## Phase 11 — Dashboard Analytics

### Task 16: Dashboard with charts

**Files:**
- Modify: `app/(dashboard)/dashboard/page.tsx`
- Create: `app/api/dashboard/route.ts`

- [ ] **Step 1: Create `app/api/dashboard/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [thisMonthCalcs, allCalcs, printers, materials] = await Promise.all([
    prisma.calculation.findMany({
      where: { userId, createdAt: { gte: startOfMonth }, status: { not: 'DRAFT' } },
      select: { sellingPrice: true, totalCost: true, materialId: true, material: { select: { name: true } } },
    }),
    prisma.calculation.findMany({
      where: { userId, status: { not: 'DRAFT' } },
      select: { sellingPrice: true, totalCost: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.printer.findMany({ where: { userId }, select: { id: true, name: true, avgHoursPerMonth: true } }),
    prisma.material.findMany({ where: { userId }, select: { id: true, name: true } }),
  ])

  const revenue = thisMonthCalcs.reduce((s, c) => s + c.sellingPrice, 0)
  const cost = thisMonthCalcs.reduce((s, c) => s + c.totalCost, 0)
  const margin = revenue > 0 ? ((revenue - cost) / revenue * 100) : 0

  // Monthly chart data — last 12 months
  const monthlyMap: Record<string, { revenue: number; cost: number }> = {}
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthlyMap[key] = { revenue: 0, cost: 0 }
  }
  allCalcs.forEach(c => {
    const key = `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, '0')}`
    if (monthlyMap[key]) {
      monthlyMap[key].revenue += c.sellingPrice
      monthlyMap[key].cost += c.totalCost
    }
  })
  const monthlyChart = Object.entries(monthlyMap).map(([month, v]) => ({ month, ...v }))

  // Top materials by revenue
  const materialRevenue: Record<string, { name: string; revenue: number }> = {}
  thisMonthCalcs.forEach(c => {
    if (c.materialId && c.material) {
      if (!materialRevenue[c.materialId]) materialRevenue[c.materialId] = { name: c.material.name, revenue: 0 }
      materialRevenue[c.materialId].revenue += c.sellingPrice
    }
  })
  const topMaterials = Object.values(materialRevenue).sort((a, b) => b.revenue - a.revenue).slice(0, 3)

  return NextResponse.json({
    thisMonth: { revenue, cost, margin: Math.round(margin), count: thisMonthCalcs.length },
    monthlyChart,
    topMaterials,
  })
}
```

- [ ] **Step 2: Update `app/(dashboard)/dashboard/page.tsx`** — fetch from `/api/dashboard`, show 4 summary cards, monthly bar chart (Recharts BarChart), top materials list, link to recent calculations.

- [ ] **Step 3: Manual test** — Add a few calculations with different statuses, verify dashboard cards and chart update.

- [ ] **Step 4: Commit**

```bash
git add app/(dashboard)/dashboard/ app/api/dashboard/
git commit -m "feat: add dashboard with revenue analytics and charts"
```

---

## Phase 12 — Docker and Deployment

### Task 17: Docker setup

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Create: `.dockerignore`

- [ ] **Step 1: Create `Dockerfile`**

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM base AS builder
RUN npm ci
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
```

- [ ] **Step 2: Enable standalone output — update `next.config.ts`**

```typescript
const nextConfig = {
  output: 'standalone',
  // ... existing rewrites
}
```

- [ ] **Step 3: Create `docker-compose.yml`**

```yaml
version: '3.8'

services:
  app:
    build: .
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:3000"
    environment:
      DATABASE_URL: postgresql://printuser:${DB_PASSWORD}@db:5432/print_calc
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: ${NEXTAUTH_URL}
      UPLOAD_DIR: /app/uploads
      MAX_UPLOAD_SIZE_MB: 50
    volumes:
      - uploads_data:/app/uploads
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    restart: unless-stopped
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: print_calc
      POSTGRES_USER: printuser
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U printuser -d print_calc"]
      interval: 5s
      retries: 10

volumes:
  pgdata:
  uploads_data:
```

- [ ] **Step 4: Create `.dockerignore`**

```
node_modules
.next
.env.local
uploads
.git
```

- [ ] **Step 5: Create `.env.production`** (for VPS — fill in actual values)

```env
DB_PASSWORD=<strong-random-password>
NEXTAUTH_SECRET=<openssl rand -hex 32>
NEXTAUTH_URL=https://yourdomain.com
```

- [ ] **Step 6: Test Docker build locally**

```bash
docker-compose --env-file .env.production up --build
```

Verify app is accessible at http://localhost:3000.

- [ ] **Step 7: Add backup cron script `scripts/backup.sh`**

```bash
#!/bin/bash
CONTAINER=$(docker ps -qf "name=db")
BACKUP_DIR=/backups
DATE=$(date +%Y%m%d_%H%M)
mkdir -p $BACKUP_DIR
docker exec $CONTAINER pg_dump -U printuser print_calc | gzip > $BACKUP_DIR/print_calc_$DATE.sql.gz
find $BACKUP_DIR -name "print_calc_*.sql.gz" -mtime +30 -delete
echo "Backup complete: print_calc_$DATE.sql.gz"
```

```bash
chmod +x scripts/backup.sh
# Add to crontab on VPS: 0 3 * * * /path/to/scripts/backup.sh
```

- [ ] **Step 8: Commit**

```bash
git add Dockerfile docker-compose.yml .dockerignore scripts/
git commit -m "feat: add Docker and deployment configuration"
```

---

## Phase 13 — Polish and Testing

### Task 18: Run all tests, fix mobile layout

- [ ] **Step 1: Run full test suite**

```bash
npm run test:run
```

Expected: All tests PASS.

- [ ] **Step 2: Mobile responsive check** — Open each page in browser DevTools mobile view (375px). Fix any layout overflow issues. Key items:
  - Sidebar: convert to collapsible Sheet on mobile
  - Calculator form: ensure steps are single-column on mobile
  - Quote page: already max-w-lg, should be fine

- [ ] **Step 3: Fix mobile sidebar** — Update `app/(dashboard)/layout.tsx` to show hamburger button on small screens, use Shadcn `Sheet` for mobile sidebar.

- [ ] **Step 4: Add loading states** — Verify all pages show a loading indicator while fetching data. Use `Skeleton` component where needed.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: mobile responsive layout and loading states"
```

---

## Summary

| Phase | What's Built | Working Software |
|---|---|---|
| 1 | Foundation: Next.js, Prisma, calculator logic | Unit tests pass |
| 2 | Auth pages | Can register and log in |
| 3 | Dashboard layout | Navigation works, pages load |
| 4 | Settings | Tariffs and password configurable |
| 5 | Materials | Full material CRUD with filters |
| 6 | Printers | Printer management + ROI calculator |
| 7 | Calculator | Full calculation with live breakdown |
| 8 | Calculations library | Search, paginate, duplicate, delete |
| 9 | File uploads | Photo and STL upload working |
| 10 | Public quote | Shareable quote link with approval |
| 11 | Dashboard | Revenue charts and analytics |
| 12 | Docker | One-command VPS deployment |
| 13 | Polish | Mobile-ready, tests green |
