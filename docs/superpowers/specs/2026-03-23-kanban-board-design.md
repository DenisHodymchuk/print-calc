# Kanban Board — Design Spec

**Date:** 2026-03-23
**Status:** Approved

---

## Overview

A new dedicated "Дошка" section in the dashboard that displays all calculations as a Kanban board with 5 status columns. Users drag cards between columns to update order status — changes save automatically.

---

## Route & Navigation

- New route: `/board` → `app/(dashboard)/board/page.tsx` + `board-client.tsx`
- Sidebar: new "Дошка" menu item between "Розрахунки" and "Бібліотека"
- No authentication changes needed (standard dashboard auth)

---

## Columns

Five fixed columns mapping to existing `status` enum values:

| DB Status  | Column Label |
|------------|--------------|
| `DRAFT`    | Чернетки     |
| `QUOTED`   | Відправлено  |
| `APPROVED` | Погоджено    |
| `PRINTING` | Друкується   |
| `DONE`     | Готово       |

Columns are fixed-width, horizontally scrollable on smaller screens. Each column shows a count badge with the number of cards inside.

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
- **Delivery date** — shown in red if past due
- **Open button** — navigates to `/calculator/[id]`

Cards within a column are sorted newest-first (by `createdAt` descending).

---

## Drag & Drop

**Library:** `@dnd-kit/core` + `@dnd-kit/sortable`

- Columns are `Droppable` zones
- Cards are `Draggable` items
- On drop into a different column:
  1. **Optimistic UI update** — card moves immediately
  2. Background `PATCH /api/calculations/[id]` with `{ status: newStatus }`
  3. On error: card reverts to original column + error toast
- Dragging within the same column has no effect (order within column is always by date)

---

## Data Loading

- Single `GET /api/calculations` request on mount — fetches all calculations without pagination
- Client-side grouping by `status` into 5 buckets
- No polling — data is fresh on page load; optimistic updates keep UI in sync after drags
- Existing `PATCH /api/calculations/[id]` endpoint handles status update — **no new API endpoints required**

---

## Dependencies

- `@dnd-kit/core` — drag & drop core
- `@dnd-kit/sortable` — sortable context for columns
- `@dnd-kit/utilities` — CSS transform helpers

---

## Out of Scope

- Timer/progress bar for "Друкується" column
- Filtering or searching within the board
- Sorting cards manually within a column
- Creating new calculations from the board
