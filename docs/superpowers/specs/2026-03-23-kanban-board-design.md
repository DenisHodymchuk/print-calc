# Kanban Board — Design Spec

**Date:** 2026-03-23
**Status:** Approved

---

## Overview

A new dedicated "Дошка" section in the dashboard that displays all calculations as a Kanban board with 5 status columns. Users drag cards between columns to update order status — changes save automatically.

---

## Route & Navigation

- New route: `/board` → `app/(dashboard)/board/page.tsx` + `board-client.tsx`
- `page.tsx` renders `<Header title="Дошка замовлень" accent="Дошка" subtitle="Керуйте статусами замовлень" />` + `<BoardClient />`
- Sidebar: new "Дошка" menu item inserted between "Розрахунки" and "Матеріали" (the actual order in the current sidebar)

---

## Columns

Five fixed columns mapping to existing `status` enum values. Labels are consistent with the board context:

| DB Status  | Column Label |
|------------|--------------|
| `DRAFT`    | Чернетки     |
| `QUOTED`   | Кошторис     |
| `APPROVED` | Підтверджено |
| `PRINTING` | Друкується   |
| `DONE`     | Готово       |

Note: `QUOTED` uses "Кошторис" and `APPROVED` uses "Підтверджено" to match labels used in the existing calculations table (`calculations-client.tsx`).

Columns are fixed-width, horizontally scrollable on smaller screens. Each column header shows the column name and a count badge with the number of cards.

---

## Card Design

Each card displays:
- **Photo thumbnail** (64×64px) — fallback to a placeholder icon if no photo
- **Product name** (bold)
- **Client name** (if set)
- **Material** — color dot + name
- **Printer** — name
- **Selling price** — prominent, right-aligned
- **Print time** — formatted as "Xг Yхв"
- **Delivery date** — shown in red if `new Date(deliveryDate) < new Date()` (client-side local time comparison; dates entered without time component are treated as midnight UTC which may show 1 day early in UTC+2+, accepted trade-off for v1). The board's local `Calculation` TypeScript type must include `deliveryDate: string | null`.
- **Open button** — navigates to `/calculator/[id]`

Cards within a column are sorted newest-first (by `createdAt` descending).

---

## Drag & Drop

**Library:** `@dnd-kit/core` only (no `@dnd-kit/sortable` — intra-column reordering is out of scope)

- Columns use `useDroppable` hook
- Cards use `useDraggable` hook
- On drop into a **different** column:
  1. **Optimistic UI update** — card moves immediately in local state
  2. Background `PATCH /api/calculations/[id]` with all existing calculation fields + updated `status` so the endpoint recalculates costs using current material prices (the existing endpoint always recalculates on every PATCH — this is expected behavior, not a side effect to avoid)
  3. On error: card reverts to original column + error toast
- Dropping into the **same** column has no effect
- Keyboard drag-and-drop is out of scope for v1

---

## States

**Loading:** On initial fetch, each column renders 2 skeleton card placeholders (gray animated blocks matching card dimensions).

**Error (initial fetch):** If `GET /api/calculations` fails, show a full-width error banner above the board: "Не вдалося завантажити замовлення. Спробуйте оновити сторінку." No retry logic in v1.

**Empty column:** Shows a dashed border drop zone with centered muted text "Немає замовлень" — ensures the column is always a visible drag target.

---

## Data Loading

- Single `GET /api/calculations` request on mount — fetches all calculations without pagination, grouped client-side by `status`
- Accepted trade-off: suitable for typical user volumes (<200 calculations); pagination should be revisited if a user exceeds ~500 calculations
- No polling — optimistic updates keep UI in sync after drags
- **No new API endpoints required** — existing `GET /api/calculations` and `PATCH /api/calculations/[id]` are sufficient

---

## Dependencies

- `@dnd-kit/core` — drag & drop (cross-column only)
- `@dnd-kit/utilities` — CSS transform helpers for drag overlay

---

## Out of Scope

- Timer/progress bar for "Друкується" column
- Filtering or searching within the board
- Sorting cards manually within a column
- Creating new calculations from the board
- Keyboard accessibility for drag operations
