import './App.css'

const days = [
  { date: '01', in: '420 000 ₽', out: '180 000 ₽', balance: '1 240 000 ₽', items: ['+ ООО Вектор', '- Аренда', '- Связь'] },
  { date: '02', in: '0 ₽', out: '310 000 ₽', balance: '930 000 ₽', items: ['- Зарплата', '- Налоги'] },
  { date: '03', in: '180 000 ₽', out: '980 000 ₽', balance: '-50 000 ₽', items: ['+ Контур', '- Поставщик А', '- Логистика'], gap: true },
  { date: '04', in: '600 000 ₽', out: '90 000 ₽', balance: '460 000 ₽', items: ['+ Оплата счета', '- Комиссия'] },
  { date: '05', in: '90 000 ₽', out: '120 000 ₽', balance: '430 000 ₽', items: ['+ Розница', '- Хостинг', '+2 more'] },
  { date: '06', in: '0 ₽', out: '70 000 ₽', balance: '360 000 ₽', items: ['- Подрядчик'] },
  { date: '07', in: '250 000 ₽', out: '40 000 ₽', balance: '570 000 ₽', items: ['+ Аванс', '- Банк'] },
]

function App() {
  return (
    <main className="catalog">
      <header className="hero">
        <span className="eyebrow">Payment Calendar UI Kit</span>
        <h1>Component catalog for liquidity planning</h1>
        <p>
          Static frontend design system: calendar-first layout, finance tables, cash gap states,
          modal/window patterns. No backend behavior yet.
        </p>
      </header>

      <section className="section">
        <div className="sectionHead">
          <div>
            <span className="eyebrow">Foundations</span>
            <h2>Tokens and states</h2>
          </div>
          <div className="chips">
            <span className="chip active">Month</span>
            <span className="chip">Week</span>
            <span className="chip">Day</span>
          </div>
        </div>

        <div className="grid four">
          <div className="swatch navy">Navy</div>
          <div className="swatch mint">Mint</div>
          <div className="swatch cyan">Cyan</div>
          <div className="swatch red">Gap red</div>
        </div>

        <div className="row">
          <span className="badge draft">Черновик</span>
          <span className="badge approval">На согласовании</span>
          <span className="badge approved">Согласована</span>
          <span className="badge registry">В реестре</span>
          <span className="badge paid">Оплачена</span>
          <span className="badge rejected">Отклонена</span>
          <span className="badge priority">Высокий приоритет</span>
        </div>
      </section>

      <section className="section">
        <div className="sectionHead">
          <div>
            <span className="eyebrow">Calendar</span>
            <h2>Month view day cells</h2>
          </div>
          <button className="button primary">Создать заявку</button>
        </div>

        <div className="calendar">
          {days.map((day) => (
            <article className={day.gap ? 'day gap' : 'day'} key={day.date}>
              <div className="dayTop">
                <strong>{day.date}</strong>
                {day.gap && <span className="risk">Разрыв</span>}
              </div>
              <dl>
                <div><dt>Приход</dt><dd className="positive">{day.in}</dd></div>
                <div><dt>Расход</dt><dd className="negative">{day.out}</dd></div>
                <div><dt>Остаток</dt><dd>{day.balance}</dd></div>
              </dl>
              <ul>
                {day.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="section twoCols">
        <div>
          <span className="eyebrow">Controls</span>
          <h2>Inputs and filters</h2>
          <div className="panel stack">
            <input aria-label="search" placeholder="Поиск по контрагенту" />
            <div className="row">
              <button className="button primary">Применить</button>
              <button className="button">Сбросить</button>
              <button className="button danger">Показать разрывы</button>
            </div>
            <div className="chips">
              <span className="chip active">Все счета</span>
              <span className="chip">Поступления</span>
              <span className="chip">Списания</span>
              <span className="chip">Согласована</span>
            </div>
          </div>
        </div>

        <div>
          <span className="eyebrow">Widgets</span>
          <h2>Liquidity blocks</h2>
          <div className="panel stack">
            <div className="alert">03 июня: остаток ниже нуля на 50 000 ₽. Перенесите платежи или добавьте поступление.</div>
            <div className="kpis">
              <div><span>На конец месяца</span><strong>2 430 000 ₽</strong></div>
              <div><span>Ближайший разрыв</span><strong className="negative">03.06</strong></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section twoCols">
        <div className="modalSample">
          <div className="modalHead">
            <div><span className="eyebrow">Modal</span><h2>День: 03 июня</h2></div>
            <span className="close">×</span>
          </div>
          <table>
            <thead><tr><th>Тип</th><th>Контрагент</th><th>Сумма</th><th>Статус</th></tr></thead>
            <tbody>
              <tr><td>Поступление</td><td>Контур</td><td className="positive">180 000 ₽</td><td><span className="badge approved">План</span></td></tr>
              <tr><td>Списание</td><td>Поставщик А</td><td className="negative">980 000 ₽</td><td><span className="badge approval">На согласовании</span></td></tr>
            </tbody>
          </table>
        </div>

        <aside className="drawerSample">
          <span className="eyebrow">Side panel</span>
          <h2>Заявка на платёж</h2>
          <p>Карточка движения денег: сумма, дата, счёт, статья, контрагент, приоритет.</p>
          <div className="field"><span>Сумма</span><strong>980 000 ₽</strong></div>
          <div className="field"><span>Счёт</span><strong>Основной / RUB</strong></div>
          <button className="button primary">Открыть карточку</button>
        </aside>
      </section>
    </main>
  )
}

export default App
