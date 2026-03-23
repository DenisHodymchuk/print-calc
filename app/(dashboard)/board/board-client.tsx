'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { DndContext, DragEndEvent, useDroppable, useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, Clock, User, ImageIcon, ChevronDown } from 'lucide-react'
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

const COLUMNS: { id: string; label: string }[] = [
  { id: 'DRAFT',     label: 'Чернетки'     },
  { id: 'QUOTED',    label: 'Кошторис'     },
  { id: 'APPROVED',  label: 'Підтверджено' },
  { id: 'PRINTING',  label: 'Друкується'   },
  { id: 'DONE',      label: 'Готово'       },
  { id: 'CANCELLED', label: 'Скасовано'    },
]

const CARDS_LIMIT = 10

// ─── Utility ─────────────────────────────────────────────────────────────────

export function groupByStatus(
  calcs: BoardCalculation[]
): Record<string, BoardCalculation[]> {
  const groups: Record<string, BoardCalculation[]> = {
    DRAFT: [], QUOTED: [], APPROVED: [], PRINTING: [], DONE: [], CANCELLED: [],
  }
  for (const c of calcs) {
    if (groups[c.status]) groups[c.status].push(c)
  }
  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }
  return groups
}

export function applyDragEnd(
  calcs: BoardCalculation[],
  calcId: string,
  newStatus: string
): BoardCalculation[] {
  const target = calcs.find(c => c.id === calcId)
  if (!target || target.status === newStatus) return calcs
  return calcs.map(c => c.id === calcId ? { ...c, status: newStatus } : c)
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

// ─── Drag Primitives ─────────────────────────────────────────────────────────

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
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

function DraggableCardWrapper({
  id,
  children,
}: {
  id: string
  children: (props: {
    listeners: ReturnType<typeof useDraggable>['listeners']
    attributes: ReturnType<typeof useDraggable>['attributes']
    isDragging: boolean
  }) => React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id })
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined
  return (
    <div ref={setNodeRef} style={style}>
      {children({ listeners, attributes, isDragging })}
    </div>
  )
}

// ─── Card ────────────────────────────────────────────────────────────────────

function KanbanCard({
  calc,
  dragListeners,
  dragAttributes,
  isDragging,
}: {
  calc: BoardCalculation
  dragListeners?: ReturnType<typeof useDraggable>['listeners']
  dragAttributes?: ReturnType<typeof useDraggable>['attributes']
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
              'text-xs',
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

// ─── BoardClient ─────────────────────────────────────────────────────────────

export function BoardClient() {
  const [calculations, setCalculations] = useState<BoardCalculation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

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
    })
      .then(r => { if (!r.ok) throw new Error() })
      .catch(() => {
        setCalculations(calculations)
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
                  <>
                    {(expanded[col.id] ? grouped[col.id] : grouped[col.id].slice(0, CARDS_LIMIT)).map(calc => (
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
                    ))}
                    {grouped[col.id].length > CARDS_LIMIT && !expanded[col.id] && (
                      <button
                        onClick={() => setExpanded(prev => ({ ...prev, [col.id]: true }))}
                        className="w-full py-2 text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 transition-colors"
                      >
                        <ChevronDown className="w-3 h-3" />
                        Показати ще {grouped[col.id].length - CARDS_LIMIT}
                      </button>
                    )}
                  </>
                )}
              </DroppableColumn>
            </div>
          ))}
        </div>
      </DndContext>
    </div>
  )
}
