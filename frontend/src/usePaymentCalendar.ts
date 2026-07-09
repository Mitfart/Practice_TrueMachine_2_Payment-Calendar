import { useCallback, useEffect, useMemo, useState } from 'react'
import { calculateCalendar } from './calendar'
import { money, shortDate } from './format'
import { type Account, type CalendarDay, type CashFlow, type DirectoryItem, type FlowDraft, type PaymentStatus, type User, paymentCalendarApi } from './apiFacade'

export type Page = 'calendar' | 'requests' | 'receipts' | 'approvals' | 'register' | 'reports' | 'admin'
export type LoginState = { email: string; password: string; error: string; loading: boolean }
export type ApprovalLog = { paymentId: string; decision: PaymentStatus; comment: string; date: string }

export const statusLabel: Record<PaymentStatus, string> = { draft: 'Черновик', approval: 'На согласовании', approved: 'Согласована', 'in-register': 'В реестре', paid: 'Оплачена', rejected: 'Отклонена' }
export const roleLabel = { initiator: 'Инициатор', treasurer: 'Казначей', manager: 'Руководитель', admin: 'Администратор' } as const
export const pageLabel: Record<Page, string> = { calendar: 'Календарь', requests: 'Заявки', receipts: 'Поступления', approvals: 'Согласование', register: 'Реестр', reports: 'Казначейство и аналитика', admin: 'Управление данными' }
export const pageIcon: Record<Page, string> = { calendar: 'fa-calendar-days', requests: 'fa-file-invoice', receipts: 'fa-arrow-trend-up', approvals: 'fa-check-to-slot', register: 'fa-list-check', reports: 'fa-chart-line', admin: 'fa-gear' }

const monthRange = (month: string) => {
  const [year, monthNumber] = month.split('-').map(Number)
  return { start: `${month}-01`, end: new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10) }
}
const weekRange = (month: string) => {
  const start = `${month}-01`
  const end = new Date(`${start}T00:00:00`)
  end.setDate(end.getDate() + 6)
  return { start, end: end.toISOString().slice(0, 10) }
}
const download = (name: string, text: string) => {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}
const movableStatuses: Array<PaymentStatus | undefined> = ['draft', 'approval', 'approved']

const rolePages: Record<User['role'], Page[]> = {
  initiator: ['calendar'],
  treasurer: ['reports', 'calendar'],
  manager: ['approvals', 'calendar', 'reports'],
  admin: ['admin'],
}

type CalendarState = {
  page: Page
  setPage: React.Dispatch<React.SetStateAction<Page>>
  accountId: string
  setAccountId: React.Dispatch<React.SetStateAction<string>>
  period: string
  setPeriod: React.Dispatch<React.SetStateAction<string>>
  onlyGaps: boolean
  setOnlyGaps: React.Dispatch<React.SetStateAction<boolean>>
  categoryId: string
  setCategoryId: React.Dispatch<React.SetStateAction<string>>
  counterpartyId: string
  setCounterpartyId: React.Dispatch<React.SetStateAction<string>>
  status: string
  setStatus: React.Dispatch<React.SetStateAction<string>>
  periodMode: 'week' | 'month' | 'custom'
  setPeriodMode: React.Dispatch<React.SetStateAction<'week' | 'month' | 'custom'>>
  customStart: string
  setCustomStart: React.Dispatch<React.SetStateAction<string>>
  customEnd: string
  setCustomEnd: React.Dispatch<React.SetStateAction<string>>
  draggedId: string | null
  setDraggedId: React.Dispatch<React.SetStateAction<string | null>>
  dragPoint: { x: number; y: number }
  setDragPoint: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
  user: User | null
  login: LoginState
  setLogin: React.Dispatch<React.SetStateAction<LoginState>>
  users: User[]
  accounts: Account[]
  counterparties: DirectoryItem[]
  categories: DirectoryItem[]
  flows: CashFlow[]
  days: CalendarDay[]
  selectedDay: CalendarDay | null
  setSelectedDay: React.Dispatch<React.SetStateAction<CalendarDay | null>>
  message: string
  setMessage: React.Dispatch<React.SetStateAction<string>>
  availablePages: Page[]
  payments: CashFlow[]
  receipts: CashFlow[]
  visibleDays: CalendarDay[]
  nearestGap?: CalendarDay
  monthEnd: number
  approvedPayments: CashFlow[]
  needsApproval: CashFlow[]
  approvalLog: ApprovalLog[]
  draggedFlow?: CashFlow
  reload: () => void
  submitLogin: (event: React.FormEvent) => void
  autoLogin: (nextUser: User) => void
  logout: () => void
  movePayment: (date: string) => void
  setPaymentStatus: (id: string, status: PaymentStatus, comment?: string) => void
  createFlow: (draft: FlowDraft) => void
  createRegistry: (accountId: string, date: string) => void
  markPaid: (ids: string[]) => void
  exportRegistry: (flows: CashFlow[]) => void
  exportReports: () => void
  createUser: (draft: { name: string; email: string; password: string; role: User['role'] }) => Promise<void>
}

export function usePaymentCalendar(): CalendarState {
  const [page, setPage] = useState<Page>('calendar')
  const [accountId, setAccountId] = useState('all')
  const [period, setPeriod] = useState('2026-06')
  const [onlyGaps, setOnlyGaps] = useState(false)
  const [categoryId, setCategoryId] = useState('all')
  const [counterpartyId, setCounterpartyId] = useState('all')
  const [status, setStatus] = useState('all')
  const [periodMode, setPeriodMode] = useState<'week' | 'month' | 'custom'>('month')
  const [customStart, setCustomStart] = useState('2026-06-01')
  const [customEnd, setCustomEnd] = useState('2026-06-30')
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragPoint, setDragPoint] = useState({ x: 0, y: 0 })
  const [user, setUser] = useState<User | null>(null)
  const [login, setLogin] = useState<LoginState>({ email: '', password: '', error: '', loading: false })
  const [users, setUsers] = useState<User[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [counterparties, setCounterparties] = useState<DirectoryItem[]>([])
  const [categories, setCategories] = useState<DirectoryItem[]>([])
  const [flows, setFlows] = useState<CashFlow[]>([])
  const [days, setDays] = useState<CalendarDay[]>([])
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null)
  const [message, setMessage] = useState('')
  const [approvalLog, setApprovalLog] = useState<ApprovalLog[]>([])

  const availablePages = useMemo(() => user ? rolePages[user.role] : [], [user])
  const payments = useMemo(() => flows.filter((flow) => flow.type === 'payment'), [flows])
  const receipts = useMemo(() => flows.filter((flow) => flow.type === 'income'), [flows])
  const visibleDays = useMemo(() => {
    const filtered = days.map((day) => ({ ...day, flows: day.flows.filter((flow) => (categoryId === 'all' || flow.categoryId === categoryId) && (counterpartyId === 'all' || flow.counterpartyId === counterpartyId) && (status === 'all' || flow.status === status)) }))
    return onlyGaps ? filtered.filter((day) => day.hasGap) : filtered
  }, [categoryId, counterpartyId, days, onlyGaps, status])
  const nearestGap = days.find((day) => day.hasGap)
  const monthEnd = days.at(-1)?.endBalance ?? 0
  const approvedPayments = useMemo(() => payments.filter((flow) => flow.status === 'approved'), [payments])
  const needsApproval = useMemo(() => payments.filter((flow) => flow.status === 'approval'), [payments])
  const draggedFlow = flows.find((flow) => flow.id === draggedId)

  const reload = useCallback(() => {
    Promise.all([
      paymentCalendarApi.getAccounts(),
      paymentCalendarApi.getCounterparties(),
      paymentCalendarApi.getCategories(),
      user && ['manager', 'admin'].includes(user.role) ? paymentCalendarApi.getUsers() : Promise.resolve([]),
      paymentCalendarApi.getFlows(),
    ]).then(([nextAccounts, nextCounterparties, nextCategories, nextUsers, nextFlows]) => {
      setAccounts(nextAccounts)
      setCounterparties(nextCounterparties)
      setCategories(nextCategories)
      const { start, end } = periodMode === 'week' ? weekRange(period) : periodMode === 'custom' ? { start: customStart, end: customEnd } : monthRange(period)
      setUsers(nextUsers)
      setFlows(nextFlows)
      setDays(calculateCalendar(nextFlows, nextAccounts, accountId, start, end))
    })
  }, [accountId, customEnd, customStart, period, periodMode, user])

  useEffect(() => {
    paymentCalendarApi.restoreSession().then((nextUser) => { setUser(nextUser); setMessage(`Сессия восстановлена: ${nextUser.name}`) }).catch(() => undefined)
  }, [])
  useEffect(() => {
    const move = (event: DragEvent) => { if (draggedId) setDragPoint({ x: event.clientX, y: event.clientY }) }
    const clear = () => setDraggedId(null)
    window.addEventListener('dragover', move)
    window.addEventListener('dragend', clear)
    return () => { window.removeEventListener('dragover', move); window.removeEventListener('dragend', clear) }
  }, [draggedId])
  useEffect(() => { if (user) reload() }, [user, reload])
  useEffect(() => { if (user && !availablePages.includes(page)) setPage(availablePages[0]) }, [availablePages, page, user])

  const submitLogin = (event: React.FormEvent) => {
    event.preventDefault()
    setLogin((state) => ({ ...state, loading: true, error: '' }))
    paymentCalendarApi.login(login.email, login.password)
      .then((nextUser) => { setUser(nextUser); setMessage(`Вход выполнен: ${nextUser.name}`) })
      .catch(() => setLogin((state) => ({ ...state, error: 'Не удалось войти. Проверьте логин, пароль и доступность API.' })))
      .finally(() => setLogin((state) => ({ ...state, loading: false })))
  }

  const movePayment = (date: string) => {
    const dragged = flows.find((flow) => flow.id === draggedId)
    if (!dragged || dragged.type !== 'payment' || !movableStatuses.includes(dragged.status)) return
    const { start, end } = periodMode === 'week' ? weekRange(period) : periodMode === 'custom' ? { start: customStart, end: customEnd } : monthRange(period)
    const previousFlows = flows
    const nextFlows = flows.map((flow) => flow.id === dragged.id && flow.type === 'payment' ? { ...flow, date } : flow)
    const nextDays = calculateCalendar(nextFlows, accounts, accountId, start, end)
    setFlows(nextFlows)
    setDays(nextDays)
    setSelectedDay((day) => day ? nextDays.find((item) => item.date === day.date) ?? day : day)
    setDraggedId(null)
    paymentCalendarApi.moveFlow(dragged.id, date)
      .then(() => setMessage(`Платёж перенесён на ${shortDate(date)}`))
      .catch(() => { setFlows(previousFlows); setDays(calculateCalendar(previousFlows, accounts, accountId, start, end)); setMessage('Не удалось перенести платёж. Изменение отменено.') })
  }

  const setPaymentStatus = (id: string, nextStatus: PaymentStatus, comment = '') => paymentCalendarApi.setStatus(id, nextStatus, comment).then(() => { setApprovalLog((log) => nextStatus === 'approved' || nextStatus === 'rejected' ? [{ paymentId: id, decision: nextStatus, comment, date: new Date().toLocaleString('ru-RU') }, ...log] : log); setMessage(`Статус: ${statusLabel[nextStatus]}`); reload() })
  const createFlow = (draft: FlowDraft) => paymentCalendarApi.createFlow(draft).then(() => { setMessage(draft.type === 'income' ? 'Поступление создано' : 'Заявка создана'); reload() }).catch(() => setMessage('Не удалось создать движение'))
  const createRegistry = (registryAccountId: string, date: string) => paymentCalendarApi.createRegistry(registryAccountId, date).then(() => { setMessage('Реестр сформирован'); reload() }).catch((error) => setMessage(error instanceof Error ? error.message : 'Не удалось сформировать реестр'))
  const markPaid = (ids: string[]) => Promise.all(ids.map((id) => paymentCalendarApi.setStatus(id, 'paid', 'Оплачено из реестра'))).then(() => { setMessage('Оплата отмечена'); reload() })
  const exportRegistry = (rows: CashFlow[]) => download(`registry-${new Date().toISOString().slice(0, 10)}.csv`, ['Дата;Контрагент;Сумма;Назначение', ...rows.map((f) => `${f.date};${f.counterpartyId};${money(f.amount)};${f.purpose}`)].join('\n'))
  const exportReports = () => download(`reports-${period}.csv`, ['Дата;Приход;Расход;Остаток;Разрыв', ...days.map((d) => `${d.date};${money(d.income)};${money(d.outcome)};${money(d.endBalance)};${d.hasGap ? 'да' : 'нет'}`)].join('\n'))
  const autoLogin = (nextUser: User) => { setUser(nextUser); setMessage(`Вход выполнен: ${nextUser.name}`) }
  const logout = () => { paymentCalendarApi.logout(); setUser(null); setFlows([]); setDays([]) }
  const createUser = async (draft: { name: string; email: string; password: string; role: User['role'] }) => {
    await paymentCalendarApi.createUser(draft)
    setUsers(await paymentCalendarApi.getUsers())
    setMessage('Пользователь создан')
  }

  return { page, setPage, accountId, setAccountId, period, setPeriod, onlyGaps, setOnlyGaps, categoryId, setCategoryId, counterpartyId, setCounterpartyId, status, setStatus, periodMode, setPeriodMode, customStart, setCustomStart, customEnd, setCustomEnd, draggedId, setDraggedId, dragPoint, setDragPoint, user, login, setLogin, users, accounts, counterparties, categories, flows, days, selectedDay, setSelectedDay, message, setMessage, availablePages, payments, receipts, visibleDays, nearestGap, monthEnd, approvedPayments, needsApproval, approvalLog, draggedFlow, reload, submitLogin, autoLogin, logout, movePayment, setPaymentStatus, createFlow, createRegistry, markPaid, exportRegistry, exportReports, createUser }
}
