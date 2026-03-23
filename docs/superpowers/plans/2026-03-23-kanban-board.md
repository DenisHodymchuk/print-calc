# Kanban Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/board` page to the dashboard showing all calculations as a 5-column Kanban board with drag-and-drop status updates that auto-save.

**Architecture:** New `app/(dashboard)/board/` route with a client component that fetches all calculations, groups them by status client-side, and renders draggable cards using `@dnd-kit/core`. Status changes via drag trigger an optimistic UI update + background `PATCH /api/calculations/[id]` (existing endpoint, no API changes needed).

**Tech Stack:** Next.js 15 App Router, @dnd-kit/core + @dnd-kit/utilities, shadcn/ui (Card, Badge, Button), Tailwind CSS, Sonner toasts, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-03-23-kanban-board-design.md`

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `app/(dashboard)/board/page.tsx` | Page wrapper — renders Header + BoardClient |
| Create | `app/(dashboard)/board/board-client.tsx` | All Kanban UI: types, fetching, columns, cards, drag & drop |
| Modify | `components/layout/sidebar.tsx` | Add "Дошка" nav item between Розрахунки and Матеріали |

---

## Task 1: Install @dnd-kit dependencies

**Files:**
- Modify: `package.json` (via npm install)

- [ ] **Step 1: Install packages**

```bash
cd /home/hodymchuk/projects/print-calc
npm install @dnd-kit/core @dnd-kit/utilities
```

Expected: `package.json` now lists `@dnd-kit/core` and `@dnd-kit/utilities` under dependencies.

- [ ] **Step 2: Verify install**

```bash
node -e "require('@dnd-kit/core'); console.log('ok')"
```

Expected: prints `ok`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install @dnd-kit/core and @dnd-kit/utilities"
```

---

## Task 2: Add "Дошка" to sidebar

**Files:**
- Modify: `components/layout/sidebar.tsx` lines 7–16 (imports) and 20–27 (navItems)

- [ ] **Step 1: Add KanbanSquare icon import**

In `components/layout/sidebar.tsx`, add `KanbanSquare` to the lucide-react import:

```tsx
import {
  LayoutDashboard,
  Calculator,
  Layers,
  Printer,
  History,
  Settings,
  LogOut,
  ChevronRight,
  KanbanSquare,
} from 'lucide-react'
```

- [ ] **Step 2: Insert nav item**

Replace the `navItems` array with:

```tsx
const navItems = [
  { href: '/dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/calculator', label: 'Калькулятор', icon: Calculator },
  { href: '/calculations', label: 'Розрахунки', icon: History },
  { href: '/board', label: 'Дошка', icon: KanbanSquare },
  { href: '/materials', label: 'Матеріали', icon: Layers },
  { href: '/printers', label: 'Принтери', icon: Printer },
  { href: '/settings', label: 'Налаштування', icon: Settings },
]
```

- [ ] **Step 3: Commit**

```bash
git add components/layout/sidebar.tsx
git commit -m "feat: add Дошка nav item to sidebar"
```

---

## Task 3: Create page.tsx

**Files:**
- Create: `app/(dashboard)/board/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { Header } from '@/components/layout/header'
import { BoardClient } from './board-client'

export default function BoardPage() {
  return (
    <>
      <Header title="Дошка" accent="Дошка" subtitle="Керуйте статусами замовлень" />
      <BoardClient />
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(dashboard)/board/page.tsx
git commit -m "feat: add /board page route"
```

---

## Task 4: Create board-client.tsx — types, constants, static layout

**Files:**
- Create: `app/(dashboard)/board/board-client.tsx`

- [ ] **Step 1: Write failing test for groupByStatus**

Create `app/(dashboard)/board/board-client.test.ts`:

```ts
import { groupByStatus } from './board-client'

const make = (id: string, status: string) => ({
  id, status, name: 'Test', sellingPrice: 100, totalCost: 70,
  printTimeMinutes: 120, clientName: null, photoUrl: null,
  material: null, printer: null, createdAt: '2026-01-01T00:00:00.000Z',
  deliveryDate: null,
})

test('groups calculations by status', () => {
  const calcs = [make('1', 'DRAFT'), make('2', 'DONE'), make('3', 'DRAFT')]
  const result = groupByStatus(calcs)
  expect(result.DRAFT).toHaveLength(2)
  expect(result.DONE).toHaveLength(1)
  expect(result.QUOTED).toHaveLength(0)
})

test('preserves newest-first order within a column', () => {
  const calcs = [
    { ...make('a', 'DRAFT'), createdAt: '2026-01-01T00:00:00.000Z' },
    { ...make('b', 'DRAFT'), createdAt: '2026-01-03T00:00:00.000Z' },
  ]
  const result = groupByStatus(calcs)
  expect(result.DRAFT[0].id).toBe('b')
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd /home/hodymchuk/projects/print-calc
npx vitest run app/(dashboard)/board/board-client.test.ts
```

Expected: FAIL — `groupByStatus` not exported yet.

- [ ] **Step 3: Create board-client.tsx with types, constants, and groupByStatus**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, Clock, User, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

export type BoardCalculation = {
  id: string
  name: string
  status: string
  sellingPrice: number
  totalCost: number
  printTimeMinutes: number
  clientName: string | null
  photoUrl: string | null
  deliveryDate: string | null
  createdAt: string
  material: { name: string; colorHex: string | null } | null
  printer: { name: string } | null
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const COLUMNS: { id: string; label: string }[] = [
  { id: 'DRAFT',    label: 'Чернетки'     },
  { id: 'QUOTED',   label: 'Кошторис'     },
  { id: 'APPROVED', label: 'Підтверджено' },
  { id: 'PRINTING', label: 'Друкується'   },
  { id: 'DONE',     label: 'Готово'       },
]

// ─── Utility ─────────────────────────────────────────────────────────────────

export function groupByStatus(
  calcs: BoardCalculation[]
): Record<string, BoardCalculation[]> {
  const groups: Record<string, BoardCalculation[]> = {
    DRAFT: [], QUOTED: [], APPROVED: [], PRINTING: [], DONE: [],
  }
  for (const c of calcs) {
    if (groups[c.status]) groups[c.status].push(c)
  }
  // sort newest-first within each column
  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }
  return groups
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}хв`
  if (m === 0) return `${h}г`
  return `${h}г ${m}хв`
}

function isPastDue(date: string | null): boolean {
  if (!date) return false
  return new Date(date) < new Date()
}

// ─── Card ────────────────────────────────────────────────────────────────────

function KanbanCard({
  calc,
  dragListeners,
  dragAttributes,
  isDragging,
}: {
  calc: BoardCalculation
  dragListeners?: Record<string, unknown>
  dragAttributes?: Record<string, unknown>
  isDragging?: boolean
}) {
  const router = useRouter()

  return (
    <div
      className={cn(
        'bg-card border rounded-lg p-3 space-y-2 cursor-grab select-none shadow-sm',
        isDragging && 'opacity-40 shadow-lg'
      )}
      {...dragListeners}
      {...dragAttributes}
    >
      {/* Top row: photo + name + price */}
      <div className="flex items-start gap-2">
        {calc.photoUrl ? (
          <img
            src={calc.photoUrl}
            alt={calc.name}
            className="w-12 h-12 rounded object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
            <ImageIcon className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight truncate">{calc.name}</p>
          {calc.clientName && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <User className="w-3 h-3" />{calc.clientName}
            </p>
          )}
        </div>
        <p className="text-sm font-bold text-primary whitespace-nowrap">
          {calc.sellingPrice.toFixed(0)} ₴
        </p>
      </div>

      {/* Material + Printer */}
      <div className="flex flex-wrap gap-1">
        {calc.material && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            {calc.material.colorHex && (
              <span
                className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0 border"
                style={{ backgroundColor: calc.material.colorHex }}
              />
            )}
            {calc.material.name}
          </span>
        )}
        {calc.material && calc.printer && (
          <span className="text-xs text-muted-foreground">·</span>
        )}
        {calc.printer && (
          <span className="text-xs text-muted-foreground">{calc.printer.name}</span>
        )}
      </div>

      {/* Time + Delivery + Open */}
      <div className="flex items-center gap-2 pt-0.5">
        {calc.printTimeMinutes > 0 && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {formatTime(calc.printTimeMinutes)}
          </span>
        )}
        {calc.deliveryDate && (
          <span
            className={cn(
              'text-xs ml-auto',
              isPastDue(calc.deliveryDate) ? 'text-destructive font-medium' : 'text-muted-foreground'
            )}
          >
            {new Date(calc.deliveryDate).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })}
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="w-6 h-6 ml-auto"
          onClick={e => { e.stopPropagation(); router.push(`/calculator/${calc.id}`) }}
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function ColumnSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2].map(i => (
        <div key={i} className="bg-muted/50 rounded-lg h-24 animate-pulse" />
      ))}
    </div>
  )
}

// ─── BoardClient (static, no drag yet) ───────────────────────────────────────

export function BoardClient() {
  const [calculations, setCalculations] = useState<BoardCalculation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/calculations')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(data => setCalculations(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  const grouped = groupByStatus(calculations)

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 text-destructive px-4 py-3 text-sm">
          Не вдалося завантажити замовлення. Спробуйте оновити сторінку.
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 pb-8">
      <div className="flex gap-4 overflow-x-auto pb-2 min-h-[calc(100vh-160px)]">
        {COLUMNS.map(col => (
          <div key={col.id} className="flex-shrink-0 w-64 flex flex-col">
            {/* Column header */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className="font-semibold text-sm">{col.label}</span>
              <Badge variant="secondary" className="text-xs h-5 min-w-5 px-1.5">
                {grouped[col.id]?.length ?? 0}
              </Badge>
            </div>

            {/* Cards */}
            <div className="flex-1 space-y-2 min-h-16 rounded-lg border-2 border-dashed border-transparent p-1">
              {loading ? (
                <ColumnSkeleton />
              ) : grouped[col.id].length === 0 ? (
                <div className="h-full min-h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">Немає замовлень</span>
                </div>
              ) : (
                grouped[col.id].map(calc => (
                  <KanbanCard key={calc.id} calc={calc} />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx vitest run app/(dashboard)/board/board-client.test.ts
```

Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/(dashboard)/board/board-client.tsx app/(dashboard)/board/board-client.test.ts
git commit -m "feat: add kanban board static layout with types and card rendering"
```

---

## Task 5: Add drag and drop

**Files:**
- Modify: `app/(dashboard)/board/board-client.tsx` (add DndContext, useDroppable, useDraggable)

- [ ] **Step 1: Write failing test for drag handler logic**

Add to `board-client.test.ts`:

```ts
import { applyDragEnd } from './board-client'

test('applyDragEnd moves card to new column', () => {
  const calcs = [make('1', 'DRAFT'), make('2', 'QUOTED')]
  const result = applyDragEnd(calcs, '1', 'QUOTED')
  expect(result.find(c => c.id === '1')?.status).toBe('QUOTED')
  expect(result.find(c => c.id === '2')?.status).toBe('QUOTED')
})

test('applyDragEnd returns same array when status unchanged', () => {
  const calcs = [make('1', 'DRAFT')]
  const result = applyDragEnd(calcs, '1', 'DRAFT')
  expect(result).toBe(calcs) // reference equality — no update
})

test('applyDragEnd returns same array when id not found', () => {
  const calcs = [make('1', 'DRAFT')]
  const result = applyDragEnd(calcs, 'notfound', 'DONE')
  expect(result).toBe(calcs)
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx vitest run app/(dashboard)/board/board-client.test.ts
```

Expected: 3 new tests fail — `applyDragEnd` not exported.

- [ ] **Step 3: Add applyDragEnd utility + drag-and-drop to board-client.tsx**

Add `applyDragEnd` after `groupByStatus`:

```tsx
export function applyDragEnd(
  calcs: BoardCalculation[],
  calcId: string,
  newStatus: string
): BoardCalculation[] {
  const target = calcs.find(c => c.id === calcId)
  if (!target || target.status === newStatus) return calcs
  return calcs.map(c => c.id === calcId ? { ...c, status: newStatus } : c)
}
```

Add `DraggableCard` and `DroppableColumn` wrappers, and wire up `DndContext`:

Add to imports at top of file:
```tsx
import { DndContext, DragEndEvent, useDroppable, useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
```

Add `DroppableColumn` component:
```tsx
function DroppableColumn({
  id,
  children,
}: {
  id: string
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex-1 space-y-2 min-h-16 rounded-lg p-1 transition-colors',
        isOver && 'bg-primary/5 ring-2 ring-primary/30'
      )}
    >
      {children}
    </div>
  )
}
```

Add `DraggableCardWrapper` component:
```tsx
function DraggableCardWrapper({
  id,
  children,
}: {
  id: string
  children: (props: {
    listeners: Record<string, unknown> | undefined
    attributes: Record<string, unknown>
    isDragging: boolean
  }) => React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id })
  const style = { transform: CSS.Translate.toString(transform) }
  return (
    <div ref={setNodeRef} style={style}>
      {children({ listeners, attributes, isDragging })}
    </div>
  )
}
```

Replace the `BoardClient` function body with the DndContext version:

```tsx
export function BoardClient() {
  const [calculations, setCalculations] = useState<BoardCalculation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/calculations')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(data => setCalculations(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  const grouped = groupByStatus(calculations)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    const calcId = String(active.id)
    const newStatus = String(over.id)
    const original = calculations.find(c => c.id === calcId)
    if (!original || original.status === newStatus) return

    const updated = applyDragEnd(calculations, calcId, newStatus)
    setCalculations(updated)

    fetch(`/api/calculations/${calcId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    }).catch(() => {
      setCalculations(calculations) // revert
      toast.error('Не вдалося змінити статус')
    })
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 text-destructive px-4 py-3 text-sm">
          Не вдалося завантажити замовлення. Спробуйте оновити сторінку.
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 pb-8">
      <DndContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-2 min-h-[calc(100vh-160px)]">
          {COLUMNS.map(col => (
            <div key={col.id} className="flex-shrink-0 w-64 flex flex-col">
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className="font-semibold text-sm">{col.label}</span>
                <Badge variant="secondary" className="text-xs h-5 min-w-5 px-1.5">
                  {grouped[col.id]?.length ?? 0}
                </Badge>
              </div>

              <DroppableColumn id={col.id}>
                {loading ? (
                  <ColumnSkeleton />
                ) : grouped[col.id].length === 0 ? (
                  <div className="h-full min-h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">Немає замовлень</span>
                  </div>
                ) : (
                  grouped[col.id].map(calc => (
                    <DraggableCardWrapper key={calc.id} id={calc.id}>
                      {({ listeners, attributes, isDragging }) => (
                        <KanbanCard
                          calc={calc}
                          dragListeners={listeners}
                          dragAttributes={attributes}
                          isDragging={isDragging}
                        />
                      )}
                    </DraggableCardWrapper>
                  ))
                )}
              </DroppableColumn>
            </div>
          ))}
        </div>
      </DndContext>
    </div>
  )
}
```

- [ ] **Step 4: Run all board tests — expect PASS**

```bash
npx vitest run app/(dashboard)/board/board-client.test.ts
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/(dashboard)/board/board-client.tsx app/(dashboard)/board/board-client.test.ts
git commit -m "feat: add drag-and-drop with optimistic status update to kanban board"
```

---

## Task 6: Final verification and push

- [ ] **Step 1: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass (no regressions).

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 3: Push**

```bash
git push
```
