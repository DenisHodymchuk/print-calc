# 3D Print Calculator — Design Spec
**Date:** 2026-03-18
**Status:** Approved

---

## Overview

A personal web application for a 3D printing service owner to calculate print costs, manage materials and printers, track all calculations, and generate client-facing quotes. Built as a Next.js full-stack monorepo, deployed on VPS via Docker.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | NextAuth.js (email/password, JWT sessions, 30-day lifetime) |
| UI | Shadcn/ui + Tailwind CSS |
| Charts | Recharts |
| 3D Preview | Three.js |
| Deployment | Docker + docker-compose on VPS |
| Language | Ukrainian (uk-UA) |
| Currency | UAH (₴), all monetary values rounded to 2 decimal places |

---

## Architecture

Single Next.js monorepo with App Router. API Routes handle all backend logic. Prisma connects to PostgreSQL. No separate backend service needed.

```
/app
  /(auth)/
    login/                — login page
    register/             — registration page
  /(dashboard)/
    dashboard/            — main analytics dashboard
    calculator/           — new calculation
    calculator/[id]/      — edit existing calculation
    calculations/         — library of all calculations (paginated)
    materials/            — plastic catalog
    printers/             — printer list
    printers/[id]/        — printer detail + ROI calculator
    settings/             — user settings
/app/api/
  auth/                   — NextAuth endpoints
  calculations/           — CRUD
  calculations/[id]/      — GET, PATCH, DELETE
  calculations/[id]/duplicate/ — POST: clone calculation (resets status to DRAFT, clears quoteToken/quoteExpiresAt/clientName/quoteApprovedAt/photoUrl, copies postProcessingSteps)
  materials/              — CRUD
  materials/[id]/purchases/ — purchase log
  printers/               — CRUD
  printers/[id]/          — GET, PATCH, DELETE
  quotes/[token]/         — GET: public quote data (no auth)
  quotes/[token]/approve/ — POST: approve quote (no auth, rate-limited, idempotent)
  upload/                 — POST: file upload (photos, STL)
/app/quote/[token]/       — public client-facing quote page (no auth required)
/prisma/schema.prisma
/components/
/lib/
  calculator.ts           — cost calculation logic
  prisma.ts               — Prisma client singleton
docker-compose.yml
.env.example
```

### Authorization Model
All API routes under `/api/` (except `auth/`, `quotes/[token]/`, and `quotes/[token]/approve/`) require a valid NextAuth session. Every read/write operation must verify that the resource's `userId` matches `session.user.id`. Requests with a valid session but mismatched ownership return HTTP 403.

---

## Environment Variables

```env
# .env.example
DATABASE_URL=postgresql://user:password@db:5432/print_calc
NEXTAUTH_SECRET=<random 32+ byte secret>
NEXTAUTH_URL=https://yourdomain.com
UPLOAD_DIR=/app/uploads          # local path inside container, mounted as Docker volume
MAX_UPLOAD_SIZE_MB=50
```

---

## Data Models

```prisma
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
  id                 String   @id @default(cuid())
  email              String   @unique
  password           String   // hashed with bcrypt (min 12 rounds)
  name               String
  businessName       String?
  hourlyRate         Float    @default(0)     // UAH per hour for labor
  electricityRate    Float    @default(4.32)  // UAH per kWh
  overheadPerJob     Float    @default(0)     // fixed UAH overhead per job
  defaultMarginPercent Float  @default(30)    // used as initial value in new calculations
  createdAt          DateTime @default(now())

  printers      Printer[]
  materials     Material[]
  calculations  Calculation[]
  // Account deletion is out of scope for v1. No delete-account feature exists in the UI.
}

model Printer {
  id               String   @id @default(cuid())
  userId           String
  user             User     @relation(fields: [userId], references: [id], onDelete: Restrict)
  name             String
  brand            String?
  purchasePrice    Float    // UAH
  powerWatts       Float    // average power draw during print
  lifetimeHours    Float    @default(2000)
  maintenanceUAH   Float    @default(0)   // monthly maintenance budget UAH
  avgHoursPerMonth Float    @default(160) // used to compute maintenance per-hour rate
  notes            String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  calculations Calculation[]
  // UI must warn user before delete if printer is referenced in any calculation
}

model Material {
  id          String       @id @default(cuid())
  userId      String
  user        User         @relation(fields: [userId], references: [id], onDelete: Restrict)
  name        String
  brand       String
  type        MaterialType
  color       String       // human name e.g. "Чорний"
  colorHex    String       // #1A1A1A
  pricePerKg  Float        // current price UAH/kg
  density     Float        @default(1.24) // g/cm³
  failureRate Float        @default(0.03) // e.g. 0.03 = 3%
  notes       String?
  inStock     Boolean      @default(true)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  purchases    MaterialPurchase[]
  calculations Calculation[]
  // UI must warn user before delete if material is referenced in any calculation
}

model MaterialPurchase {
  id          String   @id @default(cuid())
  materialId  String
  material    Material @relation(fields: [materialId], references: [id], onDelete: Cascade)
  userId      String   // denormalized for efficient ownership checks
  date        DateTime
  pricePerKg  Float
  weightKg    Float
  supplier    String?
  createdAt   DateTime @default(now())
}

model Calculation {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  printerId   String?
  printer     Printer? @relation(fields: [printerId], references: [id], onDelete: SetNull)
  materialId  String?
  material    Material? @relation(fields: [materialId], references: [id], onDelete: SetNull)

  name        String

  // Print parameters
  weightGrams        Float
  printTimeMinutes   Float
  setupMinutes       Float    @default(15)  // time for slicing, bed prep, etc.
  layerHeightMm      Float?
  infillPercent      Float?
  hasSupports        Boolean  @default(false)
  supportDensity     Float?
  stlFileUrl         String?

  // Post-processing
  postProcessingSteps PostProcessingStep[]

  // Stored cost snapshot (frozen at save time for history accuracy)
  // rawMaterialCost = weight × (pricePerKg/1000), before failure rate
  rawMaterialCost     Float @default(0)
  failureCost         Float @default(0)  // rawMaterialCost × failureRate
  machineCost         Float @default(0)
  laborCost           Float @default(0)
  postProcMaterialCost Float @default(0) // sum of PostProcessingStep.materialCost
  overheadCost        Float @default(0)
  totalCost           Float @default(0)  // sum of all above

  // Pricing
  marginPercent   Float @default(30)
  discountPercent Float @default(0)
  sellingPrice    Float @default(0)
  isBelowCost     Boolean @default(false) // true if sellingPrice < totalCost

  // Client quote
  clientName      String?
  quoteToken      String?   @unique  // crypto.randomBytes(32).toString('hex')
  quoteExpiresAt  DateTime?           // set to now() + 30 days on generation
  quoteApprovedAt DateTime?
  photoUrl        String?

  status  Status   @default(DRAFT)

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

---

## Cost Calculation Formula

All monetary values are rounded to 2 decimal places before storage and display.

```typescript
// lib/calculator.ts

interface CalculationInput {
  weightGrams:       number
  printTimeMinutes:  number
  setupMinutes:      number
  postProcessingSteps: Array<{ timeMinutes: number; materialCost: number }>
  marginPercent:     number
  discountPercent:   number
  material: {
    pricePerKg:  number
    failureRate: number   // e.g. 0.03
  }
  printer: {
    purchasePrice:    number
    powerWatts:       number
    lifetimeHours:    number
    maintenanceUAH:   number   // monthly budget
    avgHoursPerMonth: number   // configurable per printer, default 160
  }
  user: {
    electricityRate: number  // UAH/kWh
    hourlyRate:      number  // UAH/hr
    overheadPerJob:  number  // UAH flat
  }
}

interface CostBreakdown {
  rawMaterialCost:     number
  failureCost:         number
  machineCost:         number
  laborCost:           number
  postProcMaterialCost: number
  overheadCost:        number
  totalCost:           number
  sellingPrice:        number
  isBelowCost:         boolean
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function calculateCosts(input: CalculationInput): CostBreakdown {
  const printHours = input.printTimeMinutes / 60

  // Material
  const rawMaterialCost = round2(input.weightGrams * (input.material.pricePerKg / 1000))
  const failureCost     = round2(rawMaterialCost * input.material.failureRate)

  // Machine — maintenance rate derived from user-configured avgHoursPerMonth
  const depreciationPerHour = input.printer.purchasePrice / input.printer.lifetimeHours
  const maintenancePerHour  = input.printer.maintenanceUAH / input.printer.avgHoursPerMonth
  const electricityPerHour  = (input.printer.powerWatts / 1000) * input.user.electricityRate
  const machineCost = round2(printHours * (depreciationPerHour + maintenancePerHour + electricityPerHour))

  // Labor — covers setup time + post-processing time only.
  // Print time itself is excluded: the operator is not assumed to be actively present during printing.
  const postProcMinutes = input.postProcessingSteps.reduce((s, x) => s + x.timeMinutes, 0)
  const laborMinutes    = input.setupMinutes + postProcMinutes
  const laborCost       = round2((laborMinutes / 60) * input.user.hourlyRate)

  // Post-processing materials
  const postProcMaterialCost = round2(input.postProcessingSteps.reduce((s, x) => s + x.materialCost, 0))

  const overheadCost = round2(input.user.overheadPerJob)

  // totalCost is the sum of already-rounded components, ensuring the breakdown display sums correctly
  const totalCost    = round2(rawMaterialCost + failureCost + machineCost + laborCost + postProcMaterialCost + overheadCost)
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

### Below-Cost Warning
If `isBelowCost === true`, the calculator UI shows a visible warning: "⚠️ Ціна продажу нижча за собівартість". The user can still save, but the calculation is flagged.

---

## Pages & Features

### Authentication
- `/login` — email + password; sessions use NextAuth JWT strategy (30-day lifetime)
- `/register` — name, business name, email, password (min 8 chars)
- `/settings` → change password: requires current password + new password confirmation
- Password reset flow: out of scope for v1 (single-owner app, admin can reset in DB)

### Dashboard `/dashboard`
- Summary cards: revenue this month, cost this month, profit margin %, total calculations this month
- Monthly revenue/cost/profit bar chart — last 12 months (Recharts)
- Printer utilization: hours used this month per printer
- Top 3 materials by revenue this month
- Average job value trend (last 6 months sparkline)
- Last 5 calculations with quick links

### Calculator `/calculator` and `/calculator/[id]`
Multi-step form. Right panel shows live cost breakdown (donut chart + line-item table) that updates on every input change.

**Step 1 — Setup:** Product name, select printer (card dropdown), select material (card dropdown with color swatch), setup time (min, default 15)
**Step 2 — Print parameters:** Weight (g), print time (min), layer height, infill %, supports toggle + density, STL file upload (optional — shows 3D preview, suggests estimated weight as overridable hint)
**Step 3 — Post-processing:** Add/remove steps (name, time min, material cost UAH). Pre-set suggestions: "Видалення підтримок", "Шліфування", "Грунтовка", "Фарбування"
**Step 4 — Pricing:** Margin %, discount %, client name. Below-cost warning shown here if applicable.

**After save:** Upload photo button, "Створити посилання для клієнта" button (generates quoteToken + sets quoteExpiresAt = now+30d)

### Scenario Comparison
Accessible from within the calculator via "Порівняти матеріали" button. Opens a modal. Recalculates entirely in the browser using the current `calculateCosts()` function with the same parameters but swapping material. Shows a side-by-side table of up to 3 materials: rawMaterialCost, totalCost, sellingPrice, print time (unchanged). Ephemeral — not saved.

### Materials `/materials`
- Grid of material cards: color dot, brand, type badge, price/kg, in-stock toggle
- Filters: type (MaterialType enum), brand (dynamic from user's materials), color family, in-stock only
- Add/edit drawer: all Material fields + color picker
- Purchase log (per material): date, price/kg, weight, supplier. Sparkline of price history.

### Printers `/printers` and `/printers/[id]`
**List page:** Cards per printer with name, cost/hour (calculated), ROI status
**Detail page `/printers/[id]`:**
- Full cost breakdown per hour
- ROI calculator: input avg hours/month → output months to break even + cumulative cost vs. revenue chart
- `avgHoursPerMonth` field editable here (also stored on Printer model, used in maintenance rate calculation)

### Calculations Library `/calculations`
- Table: photo thumbnail, name, material, printer, totalCost, sellingPrice, status badge, date
- Search by name, filter by status / material / printer / date range
- Pagination: 20 rows per page
- Actions per row: view, edit, duplicate, delete, copy quote link (if exists)
- Duplicate action: clones all fields + postProcessingSteps, resets status to DRAFT, clears quoteToken / quoteExpiresAt / quoteApprovedAt / clientName / photoUrl

### Settings `/settings`
- Electricity rate (UAH/kWh)
- Hourly labor rate (UAH/hr)
- Overhead per job (UAH)
- Default margin %
- Business name
- Account: name, email, change password (requires current password)

### Public Quote `/quote/[token]`
No authentication required. If token does not exist or `quoteExpiresAt` has passed → show "Посилання недійсне або закінчився термін дії".

Content: product photo, product name, material name + color dot, print time, selling price (with discount badge if discountPercent > 0), business name.

"Підтвердити замовлення" button calls `POST /api/quotes/[token]/approve`:
- Rate limited: max 5 requests per IP per minute via Nginx `limit_req` directive (not in-memory — survives container restarts)
- Idempotent: if `quoteApprovedAt` is already set, returns 200 with no change
- If expired: returns 410 Gone
- On success: sets `quoteApprovedAt = now()`, `status = APPROVED`

---

## File Uploads

- Endpoint: `POST /api/upload`
- Accepted: images (JPEG, PNG, WebP) for photos; `.stl` files for 3D models
- Max size: 50 MB (configurable via `MAX_UPLOAD_SIZE_MB` env var)
- Validation: MIME type checked server-side (not just file extension)
- Storage: local filesystem at `UPLOAD_DIR` (default `/app/uploads`), mounted as a Docker named volume `uploads_data` so files survive container restarts and redeployments
- Filenames: stored as `[cuid].[ext]`, never user-provided names
- STL weight estimation: Three.js computes signed volume of the mesh. Result shown as "≈ X г (оціночно)" in the weight field as a starting point — always manually overridable. If mesh is non-manifold, estimation is skipped with a note.

---

## Deployment

```yaml
# docker-compose.yml
services:
  app:
    build: .
    command: sh -c "npx prisma migrate deploy && node server.js"
    ports: ["3000:3000"]
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
    image: postgres:16
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: print_calc
      POSTGRES_USER: printuser
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U printuser -d print_calc"]
      interval: 5s
      retries: 5

volumes:
  pgdata:
  uploads_data:
```

### Nginx + SSL
Nginx runs on the host (not in Docker) as a reverse proxy. Certbot (standalone or webroot) manages Let's Encrypt certs. Nginx proxies `proxy_pass http://127.0.0.1:3000`.

### Database Backups
Daily `pg_dump` via cron on the VPS host:
```bash
# /etc/cron.daily/backup-printcalc
docker exec <db_container> pg_dump -U printuser print_calc | gzip > /backups/print_calc_$(date +%Y%m%d).sql.gz
find /backups -name "print_calc_*.sql.gz" -mtime +30 -delete
```

---

## Out of Scope (v1)

- Password reset via email
- Multi-language support
- Payment integration
- Email notifications
- Embeddable client widget
- CO2 tracker
- Dynamic pricing rules engine
- Mobile app
- SLA / session invalidation on secret rotation
