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
