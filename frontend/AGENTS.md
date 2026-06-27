# Frontend - AGENTS.md

## Purpose

React 19 + TypeScript + Vite client for payment-calendar views and forms.

## Local Contracts

- Keep UI typed; avoid global state until props/local state stop being enough.
- Use native inputs first (`date`, `number`, `select`) before adding UI libraries.
- Calendar must display daily inflow, outflow, end balance, and liquidity-gap highlight.
- Reuse API/domain names from `docs/technical-specification.md`.

## Verification

- `npm run build`
