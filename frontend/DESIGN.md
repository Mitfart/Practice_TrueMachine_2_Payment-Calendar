# Frontend Design Direction

## Goal

Build a calm fintech interface for a Payment Calendar. First deliverable is a component catalog on the main page, not working pages.

## Direction

Use **shadcnstudio + Boldo** as the base:

- shadcnstudio: clean SaaS surfaces, rounded cards, restrained controls, component-first structure.
- Boldo: deep navy, mint/green success accents, corporate trust tone.
- Mueller: not a base style; avoid agency/portfolio visuals.

## Visual principles

- Calendar-first: the product should feel like a planning calendar, not a generic dashboard.
- Dense but readable: finance users need many entries per day without visual noise.
- Risk is obvious: cash gaps and negative balances must stand out immediately.
- Russian business UI: direct labels, clear tables, no marketing copy.
- Frontend-only now: mock data and static states are enough.

## Palette

| Token | Value | Usage |
| --- | --- | --- |
| `--navy` | `#0a2640` | headers, primary text, active state |
| `--mint` | `#65e4a3` | positive money, primary accent |
| `--cyan` | `#0dcaf0` | focus/support accent |
| `--red` | `#dc3545` | cash gap, rejection, negative balance |
| `--orange` | `#fd7e14` | warning, high priority |
| `--slate` | `#5b7075` | secondary text |
| `--line` | `#dbe5e8` | borders |
| `--paper` | `#f7fafb` | page background |
| `--card` | `#ffffff` | cards, cells, modal |

## Typography

- Font: system sans-serif.
- Headings: navy, compact, medium/semibold.
- Body: slate, 14-16px.
- Money: tabular numbers.

## Core components

### Foundations

- Color swatches
- Type scale
- Badges: status, priority, flow type

### Controls

- Button: primary, secondary, danger
- Input
- Select/date fields
- Filter chips
- Calendar scale switch: day/week/month

### Data display

- KPI tile
- Card
- Table
- Balance cell
- Cash gap alert

### Calendar components

Default view is **month**. Week/day views are available via scale switch.

Month day cell shows:

- date number
- inflow total
- outflow total
- end-of-day balance
- first 3 movements
- `+N more` overflow hint
- red risk state when balance is negative

Click behavior is not needed now. Represent the full day view with a static modal/block sample.

### Overlay/window patterns

Include static samples for:

- Day detail modal
- Side panel / drawer
- Inline alert block

## Current implementation rule

No new dependencies yet. Use React + CSS only. Add shadcn/ui only when real interactive components are needed.