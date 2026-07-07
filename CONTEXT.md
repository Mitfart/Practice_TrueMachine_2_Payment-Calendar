# Payment Calendar Context

## Domain

A payment calendar shows planned cash inflows/outflows by day and account, with end-of-day balances and liquidity-gap highlighting.

## Core entities

- Account/cashbox: opening balance, currency.
- Counterparty: payment details.
- Cash-flow category: inflow or outflow.
- Payment request: amount, date, account, counterparty, category, purpose, priority, status.
- Planned receipt: same money/date/account fields as a payment request, but positive flow.
- Approval journal: decisions and comments per request.
- Payment register: approved requests selected for payment on a date.

## Rules

- Recalculate daily balances after every move/date change.
- Highlight days where any balance goes below zero.
- Approved requests can be added to a payment register.
- Reports must cover monthly cash-flow plan/fact, deficit/overflow forecast, and overdue unpaid requests.

## Frontend vocabulary

- Calendar calculation: the frontend module interface that turns cash flows, accounts, selected account, and period into daily balances and liquidity-gap flags. Implementation lives in `frontend/src/calendar.ts`.
- Payment calendar state: the frontend module interface that owns loading, login, role pages, drag state, optimistic payment moves, and status changes. Implementation lives in `frontend/src/usePaymentCalendar.ts`.
- Formatting: the frontend module interface for money and display dates. Implementation lives in `frontend/src/format.ts`.
- Drag preview: the visual affordance shown while a payment request is moved to another day.
- Interactive feedback: cursor, hover, focus, and reduced-motion-safe animation cues that make calendar actions discoverable.
