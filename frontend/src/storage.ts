import type { User, Account, DirectoryItem, CashFlow, PaymentRegister } from './apiFacade'

const KEY = 'pc-data'

interface Store {
  _v: number
  users: User[]
  passwords: Record<string, string>
  accounts: Account[]
  counterparties: DirectoryItem[]
  categories: DirectoryItem[]
  payments: CashFlow[]
  incomes: CashFlow[]
  registries: PaymentRegister[]
}

const CURRENT_VERSION = 1

const seed = (): Store => ({
  _v: CURRENT_VERSION,
  users: [
    { id: '1', name: 'Демо Казначей', role: 'treasurer', email: 'treasurer@demo.ru' },
    { id: '2', name: 'Демо Инициатор', role: 'initiator', email: 'initiator@demo.ru' },
    { id: '3', name: 'Демо Руководитель', role: 'manager', email: 'manager@demo.ru' },
    { id: '4', name: 'Демо Администратор', role: 'admin', email: 'admin@demo.ru' },
  ],
  passwords: {
    '1': '123',
    '2': '123',
    '3': '123',
    '4': '123',
  },
  accounts: [
    { id: '1', name: 'Основной счёт', currency: 'RUB', openingBalance: 1_000_000 },
    { id: '2', name: 'Резервный счёт', currency: 'RUB', openingBalance: 500_000 },
  ],
  counterparties: [
    { id: '1', name: 'ООО «Поставщик»', type: 'payment', details: 'ИНН 7700000001' },
    { id: '2', name: 'ИП Иванов А.А.', type: 'payment', details: 'ИНН 7700000002' },
    { id: '3', name: 'ООО «Клиент»', type: 'income', details: 'ИНН 7700000003' },
    { id: '4', name: 'АО «Партнёр»', type: 'income', details: 'ИНН 7700000004' },
  ],
  categories: [
    { id: '1', name: 'Аренда', type: 'payment' },
    { id: '2', name: 'Зарплата', type: 'payment' },
    { id: '3', name: 'Маркетинг', type: 'payment' },
    { id: '4', name: 'IT и связь', type: 'payment' },
    { id: '5', name: 'Продажи', type: 'income' },
    { id: '6', name: 'Инвестиции', type: 'income' },
  ],
  payments: [
    { id: 'p1', type: 'payment', date: '2026-06-05', accountId: '1', counterpartyId: '1', categoryId: '1', purpose: 'Аренда офиса за июнь', amount: 150000, status: 'approved', priority: 'high' },
    { id: 'p2', type: 'payment', date: '2026-06-10', accountId: '1', counterpartyId: '2', categoryId: '3', purpose: 'Рекламная кампания ВКонтакте', amount: 80000, status: 'draft', priority: 'normal' },
    { id: 'p3', type: 'payment', date: '2026-06-15', accountId: '1', counterpartyId: '1', categoryId: '4', purpose: 'Оплата хостинга и доменов', amount: 12000, status: 'approval', priority: 'low' },
    { id: 'p4', type: 'payment', date: '2026-06-25', accountId: '1', counterpartyId: '2', categoryId: '2', purpose: 'Аванс сотрудникам', amount: 200000, status: 'draft', priority: 'high' },
    { id: 'p5', type: 'payment', date: '2026-06-01', accountId: '2', counterpartyId: '1', categoryId: '1', purpose: 'Аренда склада', amount: 50000, status: 'paid', priority: 'normal' },
  ],
  incomes: [
    { id: 'i1', type: 'income', date: '2026-06-03', accountId: '1', counterpartyId: '3', categoryId: '5', purpose: 'Плановое поступление', amount: 300000 },
    { id: 'i2', type: 'income', date: '2026-06-18', accountId: '1', counterpartyId: '4', categoryId: '6', purpose: 'Плановое поступление', amount: 150000 },
  ],
  registries: [],
})

export function load(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const data = JSON.parse(raw)
      if (data._v === CURRENT_VERSION) return data
    }
  } catch { /* corrupt data, re-seed */ }
  const data = seed()
  save(data)
  return data
}

export function save(store: Store) {
  localStorage.setItem(KEY, JSON.stringify(store))
}

/** Dev tool: get all demo credentials for debug menu */
export function getDemoCredentials(): { email: string; password: string; role: string }[] {
  const s = load()
  return s.users.map((u) => ({
    email: u.email ?? '',
    password: s.passwords[u.id] ?? '',
    role: u.role,
  }))
}
