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

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://127.0.0.1:8000/api'
const tokenKey = 'payment-calendar-token'
let backendOnline = false

const users: User[] = [
  { id: 'u-1', name: 'Ирина · инициатор', role: 'initiator', email: 'initiator@example.com' },
  { id: 'u-2', name: 'Олег · казначей', role: 'treasurer', email: 'treasurer@example.com' },
  { id: 'u-3', name: 'Мария · руководитель', role: 'manager', email: 'manager@example.com' },
  { id: 'u-4', name: 'Антон · администратор', role: 'admin', email: 'admin@example.com' },
]
const accounts: Account[] = [
  { id: 'main', name: 'Основной счёт', currency: 'RUB', openingBalance: 1_000_000 },
  { id: 'cash', name: 'Касса', currency: 'RUB', openingBalance: 180_000 },
  { id: 'reserve', name: 'Резервный счёт', currency: 'RUB', openingBalance: 360_000 },
]
const counterparties: DirectoryItem[] = [
  { id: 'c-vector', name: 'ООО Вектор', details: 'Покупатель' }, { id: 'c-rent', name: 'БЦ Север', details: 'Арендодатель' },
  { id: 'c-tax', name: 'ФНС', details: 'Налоги' }, { id: 'c-kontur', name: 'Контур', details: 'Покупатель' },
  { id: 'c-supplier', name: 'Поставщик А', details: 'Материалы' }, { id: 'c-staff', name: 'Сотрудники', details: 'Зарплата' },
  { id: 'c-bank', name: 'Банк', details: 'РКО' },
]
const categories: DirectoryItem[] = [
  { id: 'cat-sales', name: 'Продажи', type: 'income' }, { id: 'cat-rent', name: 'Аренда', type: 'payment' },
  { id: 'cat-tax', name: 'Налоги', type: 'payment' }, { id: 'cat-buy', name: 'Закупки', type: 'payment' },
  { id: 'cat-salary', name: 'Зарплата', type: 'payment' }, { id: 'cat-bank', name: 'Банковские комиссии', type: 'payment' },
]
let flows: CashFlow[] = [
  { id: 'i-1', type: 'income', date: '2026-06-01', accountId: 'main', counterpartyId: 'c-vector', categoryId: 'cat-sales', purpose: 'Оплата счёта 42', amount: 420_000 },
  { id: 'p-1', type: 'payment', date: '2026-06-01', accountId: 'main', counterpartyId: 'c-rent', categoryId: 'cat-rent', purpose: 'Аренда офиса', amount: 180_000, status: 'approved', priority: 'high' },
  { id: 'p-2', type: 'payment', date: '2026-06-02', accountId: 'main', counterpartyId: 'c-tax', categoryId: 'cat-tax', purpose: 'НДС', amount: 310_000, status: 'approval', priority: 'high' },
  { id: 'i-2', type: 'income', date: '2026-06-03', accountId: 'main', counterpartyId: 'c-kontur', categoryId: 'cat-sales', purpose: 'Плановое поступление', amount: 180_000 },
  { id: 'p-3', type: 'payment', date: '2026-06-03', accountId: 'main', counterpartyId: 'c-supplier', categoryId: 'cat-buy', purpose: 'Материалы', amount: 980_000, status: 'approved', priority: 'high' },
  { id: 'i-3', type: 'income', date: '2026-06-04', accountId: 'main', counterpartyId: 'c-vector', categoryId: 'cat-sales', purpose: 'Закрытие акта', amount: 600_000 },
  { id: 'p-4', type: 'payment', date: '2026-06-05', accountId: 'cash', counterpartyId: 'c-staff', categoryId: 'cat-salary', purpose: 'Аванс', amount: 120_000, status: 'in-register', priority: 'normal' },
  { id: 'p-5', type: 'payment', date: '2026-06-07', accountId: 'reserve', counterpartyId: 'c-supplier', categoryId: 'cat-buy', purpose: 'Логистика', amount: 240_000, status: 'draft', priority: 'low' },
  { id: 'i-4', type: 'income', date: '2026-06-10', accountId: 'main', counterpartyId: 'c-vector', categoryId: 'cat-sales', purpose: 'Еженедельная выручка', amount: 730_000 },
  { id: 'p-6', type: 'payment', date: '2026-06-12', accountId: 'main', counterpartyId: 'c-bank', categoryId: 'cat-bank', purpose: 'РКО', amount: 45_000, status: 'paid', priority: 'normal' },
]
const registers: PaymentRegister[] = [{ id: 'reg-2026-06-05', date: '2026-06-05', status: 'draft', total: 120_000, paymentIds: ['p-4'] }]

const delay = <T,>(data: T) => new Promise<T>((resolve) => window.setTimeout(() => resolve(structuredClone(data)), 60))
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
const fallback = async <T,>(call: () => Promise<T>, data: T) => { try { return await call() } catch { backendOnline = false; return delay(data) } }
const mapStatus = (status?: string): PaymentStatus => status === 'on_approval' ? 'approval' : status === 'in_registry' ? 'in-register' : (status as PaymentStatus) || 'draft'
const toAccount = (row: any): Account => ({ id: String(row.id), name: row.name, currency: row.currency ?? 'RUB', openingBalance: (row.opening_balance_kopecks ?? 0) / 100 })
const toDirectory = (row: any): DirectoryItem => ({ id: String(row.id), name: row.name, type: row.type === 'income' ? 'income' : row.type === 'payment' ? 'payment' : undefined, details: row.inn ?? row.details ?? '' })
const toPayment = (row: any): CashFlow => ({ id: String(row.id), type: 'payment', date: row.payment_date, accountId: String(row.account_id), counterpartyId: String(row.counterparty_id), categoryId: String(row.item_id), purpose: row.purpose ?? '', amount: row.amount_kopecks / 100, status: mapStatus(row.status), priority: row.priority > 1 ? 'high' : 'normal' })
const toIncome = (row: any): CashFlow => ({ id: `i-${row.id}`, type: 'income', date: row.income_date, accountId: String(row.account_id), counterpartyId: String(row.counterparty_id), categoryId: String(row.item_id), purpose: 'Плановое поступление', amount: row.amount_kopecks / 100 })
export const paymentCalendarApi = {
  apiBase: API_BASE,
  isBackendOnline: () => backendOnline,
  login: async (email: string, password: string) => {
    const result = await api<{ user: User; token: string }>('/login', { method: 'POST', body: JSON.stringify({ email, password }) })
    localStorage.setItem(tokenKey, result.token)
    return { ...result.user, id: String(result.user.id), role: result.user.role ?? 'treasurer' }
  },
  logout: () => { localStorage.removeItem(tokenKey); backendOnline = false; return delay(true) },
  restoreSession: async () => {
    if (!token()) throw new Error('No token')
    const user = await api<User>('/me')
    return { ...user, id: String(user.id), role: user.role ?? 'treasurer' }
  },
  getUsers: () => delay(users),
  getAccounts: () => fallback(async () => (await api<any[]>('/accounts')).map(toAccount), accounts),
  getCounterparties: () => fallback(async () => (await api<any[]>('/counterparties')).map(toDirectory), counterparties),
  getCategories: () => fallback(async () => (await api<any[]>('/items')).map(toDirectory), categories),
  getRegisters: () => fallback(async () => (await api<any[]>('/registries')).map((r) => ({ id: String(r.id), date: r.registry_date, status: mapStatus(r.status) as PaymentRegister['status'], total: 0, paymentIds: (r.payments ?? []).map((p: any) => String(p.id)) })), registers),
  getFlows: () => fallback(async () => {
    const [payments, incomes] = await Promise.all([api<any[]>('/payments'), api<any[]>('/incomes')])
    flows = [...payments.map(toPayment), ...incomes.map(toIncome)]
    return flows
  }, flows),
  createFlow: async (draft: FlowDraft) => {
    const local = { ...draft, id: `${draft.type === 'income' ? 'i' : 'p'}-${Date.now()}` }
    try {
      if (!token()) throw new Error('Debug mode')
      if (draft.type === 'income') {
        const created = await api<any>('/incomes', { method: 'POST', body: JSON.stringify({ account_id: draft.accountId, counterparty_id: draft.counterpartyId, item_id: draft.categoryId, amount_kopecks: Math.round(draft.amount * 100), income_date: draft.date }) })
        const flow = toIncome(created)
        flows = [...flows, flow]
        return flow
      }
      const created = await api<any>('/payments', { method: 'POST', body: JSON.stringify({ account_id: draft.accountId, counterparty_id: draft.counterpartyId, item_id: draft.categoryId, amount_kopecks: Math.round(draft.amount * 100), payment_date: draft.date, purpose: draft.purpose, priority: draft.priority === 'high' ? 2 : draft.priority === 'low' ? 0 : 1, status: draft.status ?? 'draft' }) })
      const flow = toPayment(created)
      flows = [...flows, flow]
      return flow
    } catch {
      backendOnline = false
      flows = [...flows, local]
      return delay(local)
    }
  },
  moveFlow: async (id: string, date: string) => {
    if (id.startsWith('i-')) throw new Error('Only payments can be moved')
    if (!token()) {
      flows = flows.map((f) => f.id === id && f.type === 'payment' ? { ...f, date } : f)
      return delay(flows.find((f) => f.id === id))
    }
    const updated = await api<any>(`/payments/${id}`, { method: 'PATCH', body: JSON.stringify({ payment_date: date }) })
    flows = flows.map((f) => f.id === id ? toPayment(updated) : f)
    return toPayment(updated)
  },
  setStatus: (id: string, status: PaymentStatus, comment = 'Frontend action') => fallback(async () => {
    if (status === 'approval') await api(`/payments/${id}/submit`, { method: 'POST' })
    else await api(`/payments/${id}/decide`, { method: 'POST', body: JSON.stringify({ decision: status, comment }) })
    flows = flows.map((f) => f.id === id ? { ...f, status } : f)
    return flows.find((f) => f.id === id)
  }, (flows = flows.map((f) => f.id === id && f.type === 'payment' ? { ...f, status } : f)).find((f) => f.id === id)),
  createRegistry: async (accountId: string, date: string) => {
    try {
      const registry = await api<any>('/registries', { method: 'POST', body: JSON.stringify({ account_id: accountId, registry_date: date }) })
      flows = flows.map((f) => registry.payments?.some((p: any) => String(p.id) === f.id) ? { ...f, status: 'in-register' } : f)
      return registry
    } catch (error) {
      backendOnline = false
      const ids = flows.filter((f) => f.type === 'payment' && f.status === 'approved' && f.accountId === accountId && f.date === date).map((f) => f.id)
      if (ids.length === 0) throw error instanceof Error ? error : new Error('Нет согласованных заявок на эту дату')
      flows = flows.map((f) => ids.includes(f.id) ? { ...f, status: 'in-register' } : f)
      return delay({ id: `reg-${date}-${accountId}`, date, status: 'draft', paymentIds: ids, total: flows.filter((f) => ids.includes(f.id)).reduce((sum, f) => sum + f.amount, 0) })
    }
  },
  getCalendar: async (start = '2026-06-01', end = '2026-06-30', accountId = 'all') => calculateCalendar(await paymentCalendarApi.getFlows(), await paymentCalendarApi.getAccounts(), accountId, start, end),
}
