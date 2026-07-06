import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import { type Account, type CalendarDay, type CashFlow, type DirectoryItem, type PaymentStatus, type User, paymentCalendarApi } from './apiFacade'

type Page = 'calendar' | 'requests' | 'receipts' | 'approvals' | 'register' | 'reports' | 'directories' | 'admin'
type LoginState = { email: string; password: string; error: string; loading: boolean }

const statusLabel: Record<PaymentStatus, string> = { draft: 'Черновик', approval: 'На согласовании', approved: 'Согласована', 'in-register': 'В реестре', paid: 'Оплачена', rejected: 'Отклонена' }
const roleLabel = { initiator: 'Инициатор', treasurer: 'Казначей', manager: 'Руководитель', admin: 'Администратор' } as const
const pageLabel: Record<Page, string> = { calendar: 'Календарь', requests: 'Заявки', receipts: 'Поступления', approvals: 'Согласование', register: 'Реестр', reports: 'Отчёты', directories: 'Справочники', admin: 'Админ' }
const pageIcon: Record<Page, string> = { calendar: 'fa-calendar-days', requests: 'fa-file-invoice', receipts: 'fa-arrow-trend-up', approvals: 'fa-check-to-slot', register: 'fa-list-check', reports: 'fa-chart-line', directories: 'fa-folder-tree', admin: 'fa-gear' }
const rolePages: Record<User['role'], Page[]> = {
  initiator: ['calendar', 'requests', 'receipts'],
  treasurer: ['calendar', 'requests', 'receipts', 'register', 'reports', 'directories'],
  manager: ['calendar', 'approvals', 'register', 'reports'],
  admin: ['calendar', 'requests', 'receipts', 'approvals', 'register', 'reports', 'directories', 'admin'],
}
const money = (value: number) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value)
const shortDate = (date: string) => new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short' }).format(new Date(`${date}T00:00:00`))

function buildCalendar(sourceFlows: CashFlow[], sourceAccounts: Account[], accountId: string, start = '2026-06-01', end = '2026-06-30') {
  const result: CalendarDay[] = []
  let balance = sourceAccounts.filter((account) => accountId === 'all' || account.id === accountId).reduce((sum, account) => sum + account.openingBalance, 0)
  for (let d = new Date(`${start}T00:00:00`); d <= new Date(`${end}T00:00:00`); d.setDate(d.getDate() + 1)) {
    const date = d.toISOString().slice(0, 10)
    const dayFlows = sourceFlows.filter((flow) => (accountId === 'all' || flow.accountId === accountId) && flow.date === date)
    const income = dayFlows.filter((flow) => flow.type === 'income').reduce((sum, flow) => sum + flow.amount, 0)
    const outcome = dayFlows.filter((flow) => flow.type === 'payment').reduce((sum, flow) => sum + flow.amount, 0)
    balance += income - outcome
    result.push({ date, income, outcome, endBalance: balance, hasGap: balance < 0, flows: dayFlows })
  }
  return result
}

function App() {
  const [page, setPage] = useState<Page>('calendar')
  const [accountId, setAccountId] = useState('all')
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
  const payments = flows.filter((flow) => flow.type === 'payment')
  const receipts = flows.filter((flow) => flow.type === 'income')
  const visibleDays = onlyGaps ? days.filter((day) => day.hasGap) : days
  const nearestGap = days.find((day) => day.hasGap)
  const monthEnd = days.at(-1)?.endBalance ?? 0
  const approvedPayments = useMemo(() => payments.filter((flow) => flow.status === 'approved'), [payments])
  const needsApproval = payments.filter((flow) => flow.status === 'approval')
  const draggedFlow = flows.find((flow) => flow.id === draggedId)
  const nameOf = (items: DirectoryItem[], id: string) => items.find((item) => item.id === id)?.name ?? id
  const accountName = (id: string) => accounts.find((account) => account.id === id)?.name ?? id

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
      setUsers(nextUsers)
      setFlows(nextFlows)
      setDays(buildCalendar(nextFlows, nextAccounts, accountId))
    })
  }, [accountId])

  useEffect(() => { paymentCalendarApi.getUsers().then(setUsers) }, [])
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
    if (!draggedId) return
    const previousFlows = flows
    const nextFlows = flows.map((flow) => flow.id === draggedId && flow.type === 'payment' ? { ...flow, date } : flow)
    setFlows(nextFlows)
    setDays(buildCalendar(nextFlows, accounts, accountId))
    setSelectedDay((day) => day ? buildCalendar(nextFlows, accounts, accountId).find((item) => item.date === day.date) ?? day : day)
    setDraggedId(null)
    paymentCalendarApi.moveFlow(draggedId, date)
      .then(() => setMessage(`Платёж перенесён на ${shortDate(date)}`))
      .catch(() => { setFlows(previousFlows); setDays(buildCalendar(previousFlows, accounts, accountId)); setMessage('Не удалось перенести платёж. Изменение отменено.') })
  }
  const setPaymentStatus = (id: string, status: PaymentStatus) => paymentCalendarApi.setStatus(id, status).then(() => { setMessage(`Статус: ${statusLabel[status]}`); reload() })
  const autoLogin = (nextUser: User) => { setUser(nextUser); setMessage(`Вход выполнен: ${nextUser.name}`) }
  const logout = () => { paymentCalendarApi.logout(); setUser(null); setFlows([]); setDays([]) }

  return <main className="appShell">
    <aside className="rail">
      <div className="logo"><i className="fa-solid fa-wallet" /></div>
      <nav>{availablePages.map((item) => <button className={page === item ? 'active' : ''} key={item} title={pageLabel[item]} onClick={() => setPage(item)}><i className={`fa-solid ${pageIcon[item]}`} /><span>{pageLabel[item]}</span></button>)}</nav>
      {user && <button className="avatar" title="Выйти" onClick={logout}>{user.name.slice(0, 1)}</button>}
    </aside>

    <section className="workspace">
      <header className="topbar"><div><span className="eyebrow">{user ? `${roleLabel[user.role]} · ${user.name}` : 'Вход'}</span><h1>{user ? pageLabel[page] : 'Платёжный календарь'}</h1></div></header>
      {message && <button className="toast" onClick={() => setMessage('')}>{message}</button>}

      {!user && <LoginScreen login={login} setLogin={setLogin} users={users} onAutoLogin={autoLogin} onSubmit={submitLogin} />}
      {user && page === 'calendar' && <><Kpis days={days} approvedPayments={approvedPayments} monthEnd={monthEnd} nearestGap={nearestGap} /><section className="panel controls"><label>Счёт<select value={accountId} onChange={(e) => setAccountId(e.target.value)}><option value="all">Все счета</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label><label>Период<input type="month" defaultValue="2026-06" /></label><button className={onlyGaps ? 'iconButton danger' : 'iconButton'} title="Только разрывы" onClick={() => setOnlyGaps((v) => !v)}><i className="fa-solid fa-triangle-exclamation" /></button></section><section className="calendar">{visibleDays.map((day) => <article className={day.hasGap ? 'day gap' : 'day'} key={day.date} onClick={() => setSelectedDay(day)} onDragOver={(e) => e.preventDefault()} onDrop={() => movePayment(day.date)}><span className="dayTop"><strong>{shortDate(day.date)}</strong><span>{day.hasGap && <b>Разрыв</b>}<button className="iconButton miniIcon plusButton" title="Новая заявка на этот день" onClick={(e) => { e.stopPropagation(); setMessage(`Новая заявка: ${shortDate(day.date)}`) }}><i className="fa-solid fa-plus" /></button></span></span><Metric label="Приход" value={money(day.income)} tone="positive" /><Metric label="Расход" value={money(day.outcome)} tone="negative" /><Metric label="Остаток" value={money(day.endBalance)} tone={day.endBalance < 0 ? 'negative' : ''} /><div className="flowContainer">{day.flows.length === 0 ? <span className="placeholder">Нет движений. Перетащите платёж сюда.</span> : <ul>{day.flows.slice(0, 4).map((flow) => <li draggable={flow.type === 'payment'} key={flow.id} onDragStart={(e) => { e.stopPropagation(); setDraggedId(flow.id); setDragPoint({ x: e.clientX, y: e.clientY }) }} className={flow.type}>{flow.type === 'income' ? '+' : '↕'} {nameOf(counterparties, flow.counterpartyId)} · {money(flow.amount)}</li>)}</ul>}</div></article>)}</section></>}
      {user && page === 'requests' && <FlowTable title="Заявки на платёж" flows={payments} counterparties={counterparties} categories={categories} accounts={accounts} onStatus={setPaymentStatus} />}
      {user && page === 'receipts' && <FlowTable title="Плановые поступления" flows={receipts} counterparties={counterparties} categories={categories} accounts={accounts} />}
      {user && page === 'approvals' && <Approvals flows={needsApproval} counterparties={counterparties} onStatus={setPaymentStatus} />}
      {user && page === 'register' && <Register approvedPayments={approvedPayments} counterparties={counterparties} />}
      {user && page === 'reports' && <Reports days={days} flows={flows} counterparties={counterparties} />}
      {user && page === 'directories' && <Directories accounts={accounts} counterparties={counterparties} categories={categories} />}
      {user && page === 'admin' && <Admin users={users} />}
    </section>

    {selectedDay && <div className="modalBackdrop" onClick={() => setSelectedDay(null)}><section className="modal" onClick={(e) => e.stopPropagation()} onDragOver={(e) => e.preventDefault()} onDrop={() => movePayment(selectedDay.date)}><header><h2>{shortDate(selectedDay.date)}</h2><div className="actions"><button className="iconButton plusButton" title="Новая заявка на этот день" onClick={() => setMessage(`Новая заявка: ${shortDate(selectedDay.date)}`)}><i className="fa-solid fa-plus" /></button><button className="iconButton" title="Закрыть" onClick={() => setSelectedDay(null)}><i className="fa-solid fa-xmark" /></button></div></header><div className="modalDropZone"><i className="fa-solid fa-arrows-up-down-left-right" /> Перетащите платёж сюда, чтобы перенести на этот день</div>{selectedDay.flows.length === 0 ? <p>Движений нет.</p> : selectedDay.flows.map((flow) => <div className="flowCard" draggable={flow.type === 'payment'} onDragStart={(e) => { setDraggedId(flow.id); setDragPoint({ x: e.clientX, y: e.clientY }) }} key={flow.id}><span>{nameOf(categories, flow.categoryId)} · {nameOf(counterparties, flow.counterpartyId)}</span><strong className={flow.type === 'income' ? 'positive' : 'negative'}>{flow.type === 'income' ? '+' : '-'} {money(flow.amount)}</strong><small>{accountName(flow.accountId)} · {flow.purpose}</small></div>)}</section></div>}
    {draggedFlow && <div className="dragPreview" style={{ left: dragPoint.x + 14, top: dragPoint.y + 14 }}><strong>{nameOf(counterparties, draggedFlow.counterpartyId)}</strong><span>{money(draggedFlow.amount)}</span></div>}
  </main>
}

function LoginScreen({ login, setLogin, users, onAutoLogin, onSubmit }: { login: LoginState; setLogin: React.Dispatch<React.SetStateAction<LoginState>>; users: User[]; onAutoLogin: (user: User) => void; onSubmit: (event: React.FormEvent) => void }) {
  const [autoUserId, setAutoUserId] = useState('')
  const selectedUser = users.find((item) => item.id === autoUserId) ?? users[0]
  useEffect(() => { if (!autoUserId && users[0]) setAutoUserId(users[0].id) }, [autoUserId, users])
  return <section className="loginScreen"><form className="loginCard" onSubmit={onSubmit}><i className="fa-solid fa-building-columns loginIcon" /><h2>Вход в систему</h2><p>Введите учётные данные, выданные администратором.</p><label>Email<input autoFocus type="email" value={login.email} onChange={(e) => setLogin((state) => ({ ...state, email: e.target.value }))} /></label><label>Пароль<input type="password" value={login.password} onChange={(e) => setLogin((state) => ({ ...state, password: e.target.value }))} /></label>{login.error && <div className="formError">{login.error}</div>}<button className="button primary wide" disabled={login.loading}>{login.loading ? 'Входим…' : 'Войти'}</button><div className="quickLogin"><label>Временный авто-вход<select value={autoUserId} onChange={(e) => setAutoUserId(e.target.value)}>{users.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><button className="button wide" type="button" disabled={!selectedUser} onClick={() => selectedUser && onAutoLogin(selectedUser)}>Войти выбранным аккаунтом</button></div></form></section>
}
function Metric({ label, value, tone }: { label: string; value: string; tone?: string }) { return <span className="metric"><small>{label}</small><em className={tone}>{value}</em></span> }
function Kpis({ days, approvedPayments, monthEnd, nearestGap }: { days: CalendarDay[]; approvedPayments: CashFlow[]; monthEnd: number; nearestGap?: CalendarDay }) { return <section className="kpis"><div><span>Остаток на конец периода</span><strong className={monthEnd < 0 ? 'negative' : ''}>{money(monthEnd)}</strong></div><div><span>Ближайший разрыв</span><strong className="negative">{nearestGap ? shortDate(nearestGap.date) : 'нет'}</strong></div><div><span>Согласовано к оплате</span><strong>{money(approvedPayments.reduce((sum, flow) => sum + flow.amount, 0))}</strong></div><div><span>Дней с разрывом</span><strong>{days.filter((day) => day.hasGap).length}</strong></div></section> }
function FlowTable({ title, flows, counterparties, categories, accounts, onStatus }: { title: string; flows: CashFlow[]; counterparties: DirectoryItem[]; categories: DirectoryItem[]; accounts: Account[]; onStatus?: (id: string, status: PaymentStatus) => void }) { const nameOf = (items: DirectoryItem[], id: string) => items.find((item) => item.id === id)?.name ?? id; return <section className="panel"><h2>{title}</h2><table><thead><tr><th>Дата</th><th>Контрагент</th><th>Статья</th><th>Счёт</th><th>Сумма</th><th>Статус</th><th></th></tr></thead><tbody>{flows.map((flow) => <tr key={flow.id}><td>{shortDate(flow.date)}</td><td>{nameOf(counterparties, flow.counterpartyId)}</td><td>{nameOf(categories, flow.categoryId)}</td><td>{accounts.find((a) => a.id === flow.accountId)?.name}</td><td className={flow.type === 'income' ? 'positive' : 'negative'}>{money(flow.amount)}</td><td>{flow.status ? <span className={`badge ${flow.status}`}>{statusLabel[flow.status]}</span> : 'План'}</td><td>{onStatus && flow.status === 'draft' && <button className="button mini" onClick={() => onStatus(flow.id, 'approval')}>На согласование</button>}</td></tr>)}</tbody></table></section> }
function Approvals({ flows, counterparties, onStatus }: { flows: CashFlow[]; counterparties: DirectoryItem[]; onStatus: (id: string, status: PaymentStatus) => void }) { const nameOf = (id: string) => counterparties.find((i) => i.id === id)?.name ?? id; return <section className="cards">{flows.length === 0 ? <Empty title="Нет заявок на согласование" /> : flows.map((flow) => <article className="panel card" key={flow.id}><h2>{nameOf(flow.counterpartyId)}</h2><p>{flow.purpose}</p><strong>{money(flow.amount)}</strong><div className="actions"><button className="button primary" onClick={() => onStatus(flow.id, 'approved')}>Утвердить</button><button className="button danger" onClick={() => onStatus(flow.id, 'rejected')}>Отклонить</button></div></article>)}</section> }
function Register({ approvedPayments, counterparties }: { approvedPayments: CashFlow[]; counterparties: DirectoryItem[] }) { const total = approvedPayments.reduce((sum, flow) => sum + flow.amount, 0); const nameOf = (id: string) => counterparties.find((i) => i.id === id)?.name ?? id; return <section className="panel"><h2>Реестр платежей</h2><p>В реестр попадают согласованные заявки.</p>{approvedPayments.map((flow) => <div className="registerRow" key={flow.id}><span>{nameOf(flow.counterpartyId)}</span><strong>{money(flow.amount)}</strong></div>)}<div className="total"><span>Итого</span><strong>{money(total)}</strong></div><button className="button primary wide">Сформировать и выгрузить файл</button></section> }
function Reports({ days, flows, counterparties }: { days: CalendarDay[]; flows: CashFlow[]; counterparties: DirectoryItem[] }) { const gaps = days.filter((day) => day.hasGap); const overdue = flows.filter((flow) => flow.type === 'payment' && flow.date < '2026-06-06' && flow.status !== 'paid'); return <section className="cards"><article className="panel card"><h2>Ближайшие разрывы</h2>{gaps.slice(0, 5).map((day) => <p key={day.date}>{shortDate(day.date)} · {money(day.endBalance)}</p>)}</article><article className="panel card"><h2>План/факт</h2><p>Поступления: {money(flows.filter((f) => f.type === 'income').reduce((s, f) => s + f.amount, 0))}</p><p>Платежи: {money(flows.filter((f) => f.type === 'payment').reduce((s, f) => s + f.amount, 0))}</p></article><article className="panel card"><h2>Просроченные неоплаченные</h2>{overdue.map((flow) => <p key={flow.id}>{counterparties.find((i) => i.id === flow.counterpartyId)?.name} · {money(flow.amount)}</p>)}</article></section> }
function Directories({ accounts, counterparties, categories }: { accounts: Account[]; counterparties: DirectoryItem[]; categories: DirectoryItem[] }) { return <section className="cards"><List title="Счета и кассы" rows={accounts.map((i) => `${i.name} · ${money(i.openingBalance)}`)} /><List title="Контрагенты" rows={counterparties.map((i) => `${i.name} · ${i.details}`)} /><List title="Статьи движения" rows={categories.map((i) => `${i.name} · ${i.type === 'income' ? 'поступление' : 'списание'}`)} /></section> }
function Admin({ users }: { users: User[] }) { return <section className="cards"><List title="Пользователи и роли" rows={users.map((u) => `${u.name} · ${roleLabel[u.role]}`)} /><List title="Система" rows={['Ролевой доступ активен', 'Данные запрашиваются через API', 'Перенос платежей сохраняется сразу']} /></section> }
function List({ title, rows }: { title: string; rows: string[] }) { return <article className="panel card"><h2>{title}</h2>{rows.map((row) => <p key={row}>{row}</p>)}</article> }
function Empty({ title }: { title: string }) { return <section className="panel empty"><h2>{title}</h2><p>Ничего делать не нужно.</p></section> }
export default App
