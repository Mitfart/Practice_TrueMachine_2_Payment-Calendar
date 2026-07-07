import type { Account, CalendarDay, CashFlow } from './apiFacade'

const datesBetween = (start: string, end: string) => {
  const dates: string[] = []
  for (let d = new Date(`${start}T00:00:00`); d <= new Date(`${end}T00:00:00`); d.setDate(d.getDate() + 1)) dates.push(d.toISOString().slice(0, 10))
  return dates
}

export const calculateCalendar = (sourceFlows: CashFlow[], sourceAccounts: Account[], accountId: string, start = '2026-06-01', end = '2026-06-30'): CalendarDay[] => {
  let balance = sourceAccounts.filter((a) => accountId === 'all' || a.id === accountId).reduce((sum, a) => sum + a.openingBalance, 0)
  const scoped = sourceFlows.filter((f) => (accountId === 'all' || f.accountId === accountId) && f.status !== 'rejected')
  return datesBetween(start, end).map((date) => {
    const dayFlows = scoped.filter((f) => f.date === date)
    const income = dayFlows.filter((f) => f.type === 'income').reduce((sum, f) => sum + f.amount, 0)
    const outcome = dayFlows.filter((f) => f.type === 'payment').reduce((sum, f) => sum + f.amount, 0)
    balance += income - outcome
    return { date, income, outcome, endBalance: balance, hasGap: balance < 0, flows: dayFlows }
  })
}
