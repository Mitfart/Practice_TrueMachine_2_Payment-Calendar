import { calculateCalendar } from './calendar'
import type { User, Account, DirectoryItem, CashFlow, PaymentRegister, PaymentStatus, FlowType, FlowDraft } from './apiFacade'
import { load, save } from './storage'

let store = load()

const uid = () => Math.random().toString(36).slice(2, 10)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mutate(fn: (s: typeof store) => any) {
  const result = fn(store)
  save(store)
  return result
}

export const localApi = {
  apiBase: '/',
  isBackendOnline: () => true,

  login: async (_email: string, _password: string) => {
    // Auto-login as first demo user
    const user = store.users[0]
    localStorage.setItem('payment-calendar-token', 'local-demo')
    return user
  },

  logout: async () => {
    localStorage.removeItem('payment-calendar-token')
    return true
  },

  restoreSession: async () => {
    const token = localStorage.getItem('payment-calendar-token')
    if (!token) throw new Error('No session')
    return store.users[0]
  },

  getUsers: async () => store.users,

  createUser: async (draft: { name: string; email: string; password: string; role: User['role'] }) =>
    mutate((s) => {
      const user: User = { id: uid(), name: draft.name, role: draft.role, email: draft.email }
      s.users = [...s.users, user]
      return user
    }),

  getDebugUsers: async () => store.users,

  debugLogin: async (userId: string) => {
    const user = store.users.find((u) => u.id === userId)
    if (!user) throw new Error('User not found')
    localStorage.setItem('payment-calendar-token', 'local-debug')
    return user
  },

  getAccounts: async () => store.accounts,

  getCounterparties: async () => store.counterparties,

  getCategories: async () => store.categories,

  createAccount: async (draft: { name: string; openingBalance: number }) =>
    mutate((s) => {
      const account: Account = { id: uid(), name: draft.name, currency: 'RUB', openingBalance: draft.openingBalance }
      s.accounts = [...s.accounts, account]
      return account
    }),

  createCounterparty: async (draft: { name: string; inn: string }) =>
    mutate((s) => {
      const item: DirectoryItem = { id: uid(), name: draft.name, type: 'payment', details: draft.inn }
      s.counterparties = [...s.counterparties, item]
      return item
    }),

  createCategory: async (draft: { name: string; type: FlowType }) =>
    mutate((s) => {
      const item: DirectoryItem = { id: uid(), name: draft.name, type: draft.type }
      s.categories = [...s.categories, item]
      return item
    }),

  getRegisters: async () => store.registries,

  getFlows: async () => [...store.payments, ...store.incomes],

  createFlow: async (draft: FlowDraft) =>
    mutate((s) => {
      if (draft.type === 'income') {
        const flow: CashFlow = { id: `i-${uid()}`, type: 'income', date: draft.date, accountId: draft.accountId, counterpartyId: draft.counterpartyId, categoryId: draft.categoryId, purpose: 'Плановое поступление', amount: draft.amount }
        s.incomes = [...s.incomes, flow]
        return flow
      }
      const flow: CashFlow = { id: uid(), type: 'payment', date: draft.date, accountId: draft.accountId, counterpartyId: draft.counterpartyId, categoryId: draft.categoryId, purpose: draft.purpose, amount: draft.amount, status: draft.status ?? 'draft', priority: draft.priority ?? 'normal' }
      s.payments = [...s.payments, flow]
      return flow
    }),

  moveFlow: async (id: string, date: string) =>
    mutate((s) => {
      const idx = s.payments.findIndex((p) => p.id === id)
      if (idx === -1) throw new Error('Payment not found')
      s.payments = s.payments.map((p, i) => i === idx ? { ...p, date } : p)
      return s.payments[idx]
    }),

  setStatus: async (id: string, status: PaymentStatus, _comment = '') =>
    mutate((s) => {
      const pIdx = s.payments.findIndex((p) => p.id === id)
      if (pIdx !== -1) {
        s.payments = s.payments.map((p, i) => i === pIdx ? { ...p, status } : p)
        return s.payments[pIdx]
      }
      const iIdx = s.incomes.findIndex((f) => f.id === id)
      if (iIdx !== -1) {
        s.incomes = s.incomes.map((f, i) => i === iIdx ? { ...f, status } : f)
        return s.incomes[iIdx]
      }
      return undefined
    }),

  createRegistry: async (accountId: string, date: string) =>
    mutate((s) => {
      const approved = s.payments.filter((p) => p.status === 'approved' && p.accountId === accountId)
      if (approved.length === 0) throw new Error('Нет согласованных платежей для этого счёта')
      const registry: PaymentRegister = {
        id: uid(),
        date,
        status: 'draft',
        total: approved.reduce((sum, p) => sum + p.amount, 0),
        paymentIds: approved.map((p) => p.id),
      }
      s.payments = s.payments.map((p) => approved.some((a) => a.id === p.id) ? { ...p, status: 'in-register' as PaymentStatus } : p)
      s.registries = [...s.registries, registry]
      return registry
    }),

  getCalendar: async (start = '2026-06-01', end = '2026-06-30', accountId = 'all') => {
    const flows = [...store.payments, ...store.incomes]
    return calculateCalendar(flows, store.accounts, accountId, start, end)
  },
}
