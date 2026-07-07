import { useCallback, useEffect, useMemo, useState } from 'react'
import { calculateCalendar } from './calendar'
import { shortDate } from './format'
import { type Account, type CalendarDay, type CashFlow, type DirectoryItem, type FlowDraft, type PaymentStatus, type User, paymentCalendarApi } from './apiFacade'

export type Page = 'calendar' | 'requests' | 'receipts' | 'approvals' | 'register' | 'reports' | 'directories' | 'admin'
export type LoginState = { email: string; password: string; error: string; loading: boolean }

export const statusLabel: Record<PaymentStatus, string> = { draft: 'Черновик', approval: 'На согласовании', approved: 'Согласована', 'in-register': 'В реестре', paid: 'Оплачена', rejected: 'Отклонена' }
export const roleLabel = { initiator: 'Инициатор', treasurer: 'Казначей', manager: 'Руководитель', admin: 'Администратор' } as const
export const pageLabel: Record<Page, string> = { calendar: 'Календарь', requests: 'Заявки', receipts: 'Поступления', approvals: 'Согласование', register: 'Реестр', reports: 'Отчёты', directories: 'Справочники', admin: 'Админ' }
export const pageIcon: Record<Page, string> = { calendar: 'fa-calendar-days', requests: 'fa-file-invoice', receipts: 'fa-arrow-trend-up', approvals: 'fa-check-to-slot', register: 'fa-list-check', reports: 'fa-chart-line', directories: 'fa-folder-tree', admin: 'fa-gear' }

const monthRange = (month: string) => {
  const [year, monthNumber] = month.split('-').map(Number)
  return { start: `${month}-01`, end: new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10) }
}
const movableStatuses: Array<PaymentStatus | undefined> = ['draft', 'approval', 'approved']

const rolePages: Record<User['role'], Page[]> = {
  initiator: ['calendar', 'requests', 'receipts'],
  treasurer: ['calendar', 'requests', 'receipts', 'register', 'reports', 'directories'],
  manager: ['calendar', 'approvals', 'register', 'reports'],
  admin: ['calendar', 'requests', 'receipts', 'approvals', 'register', 'reports', 'directories', 'admin'],
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
  draggedFlow?: CashFlow
  reload: () => void
  submitLogin: (event: React.FormEvent) => void
  autoLogin: (nextUser: User) => void
  logout: () => void
  movePayment: (date: string) => void
  setPaymentStatus: (id: string, status: PaymentStatus) => void
  createFlow: (draft: FlowDraft) => void
  createRegistry: (accountId: string, date: string) => void
}

export function usePaymentCalendar(): CalendarState {
  const [page, setPage] = useState<Page>('calendar')
  const [accountId, setAccountId] = useState('all')
  const [period, setPeriod] = useState('2026-06')
  const [onlyGaps, setOnlyGaps] = useState(false)
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

  const availablePages = useMemo(() => user ? rolePages[user.role] : [], [user])
  const payments = useMemo(() => flows.filter((flow) => flow.type === 'payment'), [flows])
  const receipts = useMemo(() => flows.filter((flow) => flow.type === 'income'), [flows])
  const visibleDays = useMemo(() => onlyGaps ? days.filter((day) => day.hasGap) : days, [days, onlyGaps])
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
      paymentCalendarApi.getUsers(),
      paymentCalendarApi.getFlows(),
    ]).then(([nextAccounts, nextCounterparties, nextCategories, nextUsers, nextFlows]) => {
      setAccounts(nextAccounts)
      setCounterparties(nextCounterparties)
      setCategories(nextCategories)
      const { start, end } = monthRange(period)
      setUsers(nextUsers)
      setFlows(nextFlows)
      setDays(calculateCalendar(nextFlows, nextAccounts, accountId, start, end))
    })
  }, [accountId, period])

  useEffect(() => {
    paymentCalendarApi.getUsers().then(setUsers)
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
    const { start, end } = monthRange(period)
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

  const setPaymentStatus = (id: string, status: PaymentStatus) => paymentCalendarApi.setStatus(id, status).then(() => { setMessage(`Статус: ${statusLabel[status]}`); reload() })
  const createFlow = (draft: FlowDraft) => paymentCalendarApi.createFlow(draft).then(() => { setMessage(draft.type === 'income' ? 'Поступление создано' : 'Заявка создана'); reload() }).catch(() => setMessage('Не удалось создать движение'))
  const createRegistry = (registryAccountId: string, date: string) => paymentCalendarApi.createRegistry(registryAccountId, date).then(() => { setMessage('Реестр сформирован'); reload() }).catch((error) => setMessage(error instanceof Error ? error.message : 'Не удалось сформировать реестр'))
  const autoLogin = (nextUser: User) => { setUser(nextUser); setMessage(`Вход выполнен: ${nextUser.name}`) }
  const logout = () => { paymentCalendarApi.logout(); setUser(null); setFlows([]); setDays([]) }

  return { page, setPage, accountId, setAccountId, period, setPeriod, onlyGaps, setOnlyGaps, draggedId, setDraggedId, dragPoint, setDragPoint, user, login, setLogin, users, accounts, counterparties, categories, flows, days, selectedDay, setSelectedDay, message, setMessage, availablePages, payments, receipts, visibleDays, nearestGap, monthEnd, approvedPayments, needsApproval, draggedFlow, reload, submitLogin, autoLogin, logout, movePayment, setPaymentStatus, createFlow, createRegistry }
}
