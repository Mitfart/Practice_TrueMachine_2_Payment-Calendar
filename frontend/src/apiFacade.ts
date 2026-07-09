import { calculateCalendar } from './calendar'

export type UserRole = 'initiator' | 'treasurer' | 'manager' | 'admin'
export type PaymentStatus = 'draft' | 'approval' | 'approved' | 'in-register' | 'paid' | 'rejected'
export type FlowType = 'income' | 'payment'

export type User = { id: string; name: string; role: UserRole; email?: string }
export type Account = { id: string; name: string; currency: 'RUB'; openingBalance: number }
export type DirectoryItem = { id: string; name: string; type?: FlowType; details?: string }
export type CashFlow = {
  id: string
  type: FlowType
  date: string
  accountId: string
  counterpartyId: string
  categoryId: string
  purpose: string
  amount: number
  status?: PaymentStatus
  priority?: 'low' | 'normal' | 'high'
}
export type CalendarDay = { date: string; income: number; outcome: number; endBalance: number; hasGap: boolean; flows: CashFlow[] }
export type PaymentRegister = { id: string; date: string; status: 'draft' | 'approved' | 'exported' | 'paid'; total: number; paymentIds: string[] }
export type FlowDraft = Omit<CashFlow, 'id' | 'type' | 'amount'> & { type: FlowType; amount: number }

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api'
const tokenKey = 'payment-calendar-token'
let backendOnline = false

let flows: CashFlow[] = []
const token = () => localStorage.getItem(tokenKey)
const api = async <T,>(path: string, init: RequestInit = {}) => {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (!(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  if (token()) headers.set('Authorization', `Bearer ${token()}`)
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers })
  if (!response.ok) throw new Error(await response.text())
  backendOnline = true
  return response.status === 204 ? undefined as T : await response.json() as T
}
const mapStatus = (status?: string): PaymentStatus => status === 'on_approval' ? 'approval' : status === 'in_registry' ? 'in-register' : (status as PaymentStatus) || 'draft'
const toAccount = (row: any): Account => ({ id: String(row.id), name: row.name, currency: row.currency ?? 'RUB', openingBalance: (row.opening_balance_kopecks ?? 0) / 100 })
const toDirectory = (row: any): DirectoryItem => ({ id: String(row.id), name: row.name, type: row.type === 'income' ? 'income' : row.type === 'payment' ? 'payment' : undefined, details: row.inn ?? row.details ?? '' })
const toPayment = (row: any): CashFlow => ({ id: String(row.id), type: 'payment', date: row.payment_date, accountId: String(row.account_id), counterpartyId: String(row.counterparty_id), categoryId: String(row.item_id), purpose: row.purpose ?? '', amount: row.amount_kopecks / 100, status: mapStatus(row.status), priority: ['low', 'normal', 'high'].includes(row.priority) ? row.priority : 'normal' })
const toIncome = (row: any): CashFlow => ({ id: `i-${row.id}`, type: 'income', date: row.income_date, accountId: String(row.account_id), counterpartyId: String(row.counterparty_id), categoryId: String(row.item_id), purpose: 'Плановое поступление', amount: row.amount_kopecks / 100 })
export const paymentCalendarApi = {
  apiBase: API_BASE,
  isBackendOnline: () => backendOnline,
  login: async (email: string, password: string) => {
    const result = await api<{ user: User; token: string }>('/login', { method: 'POST', body: JSON.stringify({ email, password }) })
    localStorage.setItem(tokenKey, result.token)
    return { ...result.user, id: String(result.user.id), role: result.user.role ?? 'treasurer' }
  },
  logout: async () => { if (token()) await api('/logout', { method: 'POST' }); localStorage.removeItem(tokenKey); backendOnline = false; return true },
  restoreSession: async () => {
    if (!token()) throw new Error('No token')
    const user = await api<User>('/me')
    return { ...user, id: String(user.id), role: user.role ?? 'treasurer' }
  },
  getUsers: async () => (await api<User[]>('/users')).map((user) => ({ ...user, id: String(user.id) })),
  createUser: async (draft: { name: string; email: string; password: string; role: UserRole }) => {
    const user = await api<User>('/users', { method: 'POST', body: JSON.stringify(draft) })
    return { ...user, id: String(user.id) }
  },
  getDebugUsers: async () => (await api<User[]>('/debug/users')).map((user) => ({ ...user, id: String(user.id) })),
  debugLogin: async (userId: string) => {
    const result = await api<{ user: User; token: string }>(`/debug/login/${userId}`, { method: 'POST' })
    localStorage.setItem(tokenKey, result.token)
    return { ...result.user, id: String(result.user.id) }
  },
  getAccounts: async () => (await api<any[]>('/accounts')).map(toAccount),
  getCounterparties: async () => (await api<any[]>('/counterparties')).map(toDirectory),
  getCategories: async () => (await api<any[]>('/items')).map(toDirectory),
  getRegisters: async () => (await api<any[]>('/registries')).map((r) => ({ id: String(r.id), date: r.registry_date, status: mapStatus(r.status) as PaymentRegister['status'], total: 0, paymentIds: (r.payments ?? []).map((p: any) => String(p.id)) })),
  getFlows: async () => {
    const [payments, incomes] = await Promise.all([api<any[]>('/payments'), api<any[]>('/incomes')])
    flows = [...payments.map(toPayment), ...incomes.map(toIncome)]
    return flows
  },
  createFlow: async (draft: FlowDraft) => {
    if (!token()) throw new Error('Требуется авторизация')
      if (draft.type === 'income') {
        const created = await api<any>('/incomes', { method: 'POST', body: JSON.stringify({ account_id: draft.accountId, counterparty_id: draft.counterpartyId, item_id: draft.categoryId, amount_kopecks: Math.round(draft.amount * 100), income_date: draft.date }) })
        const flow = toIncome(created)
        flows = [...flows, flow]
        return flow
      }
      const created = await api<any>('/payments', { method: 'POST', body: JSON.stringify({ account_id: draft.accountId, counterparty_id: draft.counterpartyId, item_id: draft.categoryId, amount_kopecks: Math.round(draft.amount * 100), payment_date: draft.date, purpose: draft.purpose, priority: draft.priority ?? 'normal', status: draft.status ?? 'draft' }) })
      const flow = toPayment(created)
      flows = [...flows, flow]
      return flow
  },
  moveFlow: async (id: string, date: string) => {
    if (id.startsWith('i-')) throw new Error('Only payments can be moved')
    if (!token()) throw new Error('Требуется авторизация')
    const updated = await api<any>(`/payments/${id}`, { method: 'PATCH', body: JSON.stringify({ payment_date: date }) })
    flows = flows.map((f) => f.id === id ? toPayment(updated) : f)
    return toPayment(updated)
  },
  setStatus: async (id: string, status: PaymentStatus, comment = 'Frontend action') => {
    if (status === 'approval') await api(`/payments/${id}/submit`, { method: 'POST' })
    else await api(`/payments/${id}/decide`, { method: 'POST', body: JSON.stringify({ decision: status, comment }) })
    flows = flows.map((f) => f.id === id ? { ...f, status } : f)
    return flows.find((f) => f.id === id)
  },
  createRegistry: async (accountId: string, date: string) => {
      const registry = await api<any>('/registries', { method: 'POST', body: JSON.stringify({ account_id: accountId, registry_date: date }) })
      flows = flows.map((f) => registry.payments?.some((p: any) => String(p.id) === f.id) ? { ...f, status: 'in-register' } : f)
      return registry
  },
  getCalendar: async (start = '2026-06-01', end = '2026-06-30', accountId = 'all') => calculateCalendar(await paymentCalendarApi.getFlows(), await paymentCalendarApi.getAccounts(), accountId, start, end),
}
