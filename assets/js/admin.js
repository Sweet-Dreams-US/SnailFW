/* =========================================================
   Snail — Admin Dashboard
   Tab switching, mock data with localStorage, live order feed
   ========================================================= */

const ADMIN_KEY = 'snail.admin.v1';

/* ----- Mock data (initial seed; persists in localStorage after first load) ----- */
const SEED = {
  orders: [
    { num: '#0142', name: 'Maya R.', mins: 2,  status: 'pending', items: ['cardamom latte (oat, +1 shot)', 'apple fritter'], total: 13.75 },
    { num: '#0141', name: 'Owen P.', mins: 5,  status: 'pending', items: ['slow bar w/ nick', 'cinnamon bun'], total: 12.00 },
    { num: '#0140', name: 'Rae T.',  mins: 8,  status: 'ready',   items: ['iced matcha (oat)', 'sour cream donut'], total: 9.75 },
    { num: '#0139', name: 'Jules H.',mins: 11, status: 'ready',   items: ['cortado', 'pumpkin cake donut x2'], total: 9.00 },
    { num: '#0138', name: 'Kai L.',  mins: 17, status: 'done',    items: ['cardamom latte', 'cardamom latte (almond)'], total: 16.75 },
    { num: '#0137', name: 'Sam B.',  mins: 22, status: 'done',    items: ['drip', 'apple fritter', 'cinnamon bun'], total: 10.50 }
  ],
  menu: [
    { id: 'cardamom-latte', name: 'cardamom latte', sub: 'cardamom · vanilla bean', price: 8,    available: true,  todaySpecial: true  },
    { id: 'slow-bar',       name: 'slow bar w/ nick',sub: 'single-origin pour',     price: 9,    available: true,  todaySpecial: false },
    { id: 'iced-matcha',    name: 'iced matcha',     sub: 'oat · lightly sweet',    price: 7,    available: true,  todaySpecial: false },
    { id: 'honey-lavender', name: 'honey lavender',  sub: 'honey · lavender',       price: 7.5,  available: true,  todaySpecial: false },
    { id: 'latte',          name: 'latte',           sub: '12oz',                   price: 6,    available: true,  todaySpecial: false },
    { id: 'cappuccino',     name: 'cappuccino',      sub: '6oz · classic',          price: 5.5,  available: true,  todaySpecial: false },
    { id: 'cortado',        name: 'cortado',         sub: '4oz · 1:1',              price: 5,    available: true,  todaySpecial: false },
    { id: 'americano',      name: 'americano',       sub: 'espresso + water',       price: 4.5,  available: true,  todaySpecial: false },
    { id: 'espresso',       name: 'espresso',        sub: 'doubleshot',             price: 4,    available: true,  todaySpecial: false },
    { id: 'drip',           name: 'drip',            sub: 'house',                  price: 3.5,  available: true,  todaySpecial: false },
    { id: 'apple-fritter',  name: 'apple fritter',   sub: 'real apples inside',     price: 4,    available: true,  todaySpecial: false },
    { id: 'cinnamon-bun',   name: 'cinnamon bun',    sub: 'warm & glazed',          price: 3,    available: true,  todaySpecial: false },
    { id: 'pumpkin-cake',   name: 'pumpkin cake',    sub: 'maple glaze',            price: 2,    available: true,  todaySpecial: false },
    { id: 'chocolate-cake', name: 'chocolate cake',  sub: 'dark glaze',             price: 2,    available: true,  todaySpecial: false },
    { id: 'sour-cream',     name: 'sour cream',      sub: 'sugar shell',            price: 2,    available: false, todaySpecial: false }
  ],
  events: [
    { day: 11, month: 'May', title: 'regular hours start ✿',   sub: 'open daily, 7am — 3pm',     time: 'all day' },
    { day: 17, month: 'May', title: 'slow bar saturday',       sub: 'kenyan single-origin w/ nick', time: '9am — 12pm' },
    { day: 24, month: 'May', title: 'open mic + drip',         sub: 'bring your guitar',         time: '6pm — 8pm' },
    { day: 31, month: 'May', title: 'donut box pre-orders',    sub: "mother's day (sun) pickups", time: 'pre-order by Sat' },
    { day:  7, month: 'Jun', title: 'cardamom workshop',       sub: 'with our roaster',          time: '10am' }
  ],
  staff: [
    { name: 'nick', role: 'slow bar barista',  hours: '7a — 1p', badge: 'on bar today',  badgeClass: 'matcha', initial: 'N' },
    { name: 'aria', role: 'lead barista',      hours: '7a — 3p', badge: 'lead',          badgeClass: '',       initial: 'A' },
    { name: 'theo', role: 'baker',             hours: '5a — 11a',badge: 'donuts done',   badgeClass: 'matcha', initial: 'T' },
    { name: 'mia',  role: 'support / counter', hours: '11a — 3p',badge: 'on counter',    badgeClass: '',       initial: 'M' }
  ],
  settings: {
    address: '725 Union St, Fort Wayne, IN 46802',
    instagram: '@snail.fw',
    pickupMin: 10,
    hours: {
      mon: '7a — 3p', tue: '7a — 3p', wed: '7a — 3p', thu: '7a — 3p',
      fri: '7a — 4p', sat: '8a — 4p', sun: '8a — 2p'
    }
  }
};

/* ----- State persistence ----- */
function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(ADMIN_KEY));
    if (stored && stored.menu && stored.orders) return stored;
  } catch {}
  return structuredClone(SEED);
}
function saveState(state) {
  localStorage.setItem(ADMIN_KEY, JSON.stringify(state));
}

let state = loadState();

/* ----- Helpers (safe-by-construction DOM) ----- */
function fmt(n) { return `$${n.toFixed(2)}`; }
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class')      node.className = v;
    else if (k === 'data')  Object.entries(v).forEach(([dk, dv]) => node.dataset[dk] = dv);
    else if (k.startsWith('aria-')) node.setAttribute(k, v);
    else if (k === 'style') node.setAttribute('style', v);
    else                    node[k] = v;
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

/* =========================================================
   ORDER PRIORITY — BUSINESS DECISION
   ---------------------------------------------------------
   When the barista has multiple pending orders, what order
   should they show in the queue?
   - 'fifo'      : oldest first (fairest, simplest)
   - 'small'     : smallest order first (fast wins, clears queue)
   - 'drinks'    : drink-only orders first (faster prep)
   - 'value'     : highest-value first (revenue-priority)
   This is a real café UX choice. Default is 'fifo'.
   ========================================================= */
const ORDER_PRIORITY = 'fifo';

function sortOrders(orders) {
  const sorters = {
    fifo:   (a, b) => b.mins - a.mins,
    small:  (a, b) => a.items.length - b.items.length,
    drinks: (a, b) => {
      const aHasFood = a.items.some(i => /donut|fritter|bun/i.test(i));
      const bHasFood = b.items.some(i => /donut|fritter|bun/i.test(i));
      return Number(aHasFood) - Number(bHasFood);
    },
    value:  (a, b) => b.total - a.total
  };
  const stage = { pending: 0, ready: 1, done: 2 };
  return orders.slice().sort((a, b) => {
    if (stage[a.status] !== stage[b.status]) return stage[a.status] - stage[b.status];
    return (sorters[ORDER_PRIORITY] || sorters.fifo)(a, b);
  });
}

/* ----- Renderers ----- */
function renderOrders() {
  const container = document.querySelector('[data-orders]');
  if (!container) return;
  container.replaceChildren();
  const filter = document.querySelector('.orders-filter .chip.is-active')?.dataset.filter || 'all';
  const orders = sortOrders(state.orders).filter(o => filter === 'all' || o.status === filter);
  if (!orders.length) {
    container.append(el('div', { class: 'card', style: 'text-align:center;color:var(--olive);font-family:var(--font-hand);font-size:1.2rem' }, 'no orders here yet 🐌'));
    return;
  }
  for (const o of orders) {
    const card = el('article', { class: `order is-${o.status}` },
      el('div', { class: 'order__head' },
        el('span', { class: 'order__num' }, o.num),
        el('span', { class: 'order__time' }, `${o.mins}m ago`)
      ),
      el('div', { class: 'order__name' }, `for ${o.name}`),
      el('ul', { class: 'order__items' }, ...o.items.map(i => el('li', {}, '· ' + i))),
      el('div', { class: 'order__foot' },
        el('span', { class: 'order__total' }, fmt(o.total)),
        o.status !== 'done' ? el('button', { class: 'order__action', data: { advance: o.num } },
          o.status === 'pending' ? 'mark ready' : 'mark picked up'
        ) : el('span', { style: 'font-family:var(--font-hand);color:var(--olive)' }, 'picked up ✓')
      )
    );
    container.append(card);
  }
  const pending = state.orders.filter(o => o.status === 'pending').length;
  const ready   = state.orders.filter(o => o.status === 'ready').length;
  const navCount = document.querySelector('[data-nav-count="orders"]');
  if (navCount) navCount.textContent = pending + ready || '';
}

function renderStats() {
  const totalRev = state.orders.reduce((s, o) => s + o.total, 0);
  const orderCount = state.orders.length;
  const avgTicket = orderCount ? totalRev / orderCount : 0;
  const pending = state.orders.filter(o => o.status === 'pending').length;
  const stats = [
    { label: "today's revenue", val: fmt(totalRev), delta: '↑ 12% vs yesterday', deltaClass: 'up' },
    { label: 'orders today',    val: orderCount,    delta: '↑ 8 vs avg',         deltaClass: 'up' },
    { label: 'avg ticket',      val: fmt(avgTicket),delta: '↓ $.22 vs week',     deltaClass: 'down' },
    { label: 'in queue',        val: pending,       delta: pending ? 'eyes up' : 'all caught up', deltaClass: pending ? 'down' : 'up' }
  ];
  document.querySelectorAll('[data-stat-row]').forEach(row => {
    row.replaceChildren();
    for (const s of stats) {
      row.append(el('div', { class: 'stat' },
        el('div', { class: 'stat__label' }, s.label),
        el('div', { class: 'stat__value' }, s.val),
        el('div', { class: `stat__delta ${s.deltaClass}` }, s.delta)
      ));
    }
  });
}

function renderMenu() {
  const container = document.querySelector('[data-menu-edit]');
  if (!container) return;
  container.replaceChildren();
  for (const item of state.menu) {
    const card = el('div', { class: `menu-edit ${item.available ? '' : 'is-disabled'}`, data: { id: item.id } },
      el('div', { class: 'menu-edit__name' }, item.name,
        item.todaySpecial ? el('span', { style: 'font-family:var(--font-hand);color:var(--brick);font-size:.95rem' }, 'today ✿') : null
      ),
      el('div', { class: 'menu-edit__sub' }, item.sub),
      el('div', { class: 'menu-edit__price' },
        el('span', {}, '$'),
        el('input', { type: 'number', step: '0.25', value: item.price, data: { field: 'price' } })
      ),
      el('div', { class: 'menu-edit__row' },
        el('label', { class: 'toggle' },
          el('input', { type: 'checkbox', checked: item.available, data: { field: 'available' } }),
          el('span', { class: 'toggle__track' }),
          el('span', {}, item.available ? 'available' : 'sold out')
        ),
        el('button', { class: 'chip', data: { special: item.id } }, item.todaySpecial ? '★ today' : 'mark today')
      )
    );
    container.append(card);
  }
}

function renderAnalytics() {
  const days = ['mon','tue','wed','thu','fri','sat','sun'];
  const revenue = [820, 760, 905, 880, 1240, 1480, 1110];
  const max = Math.max(...revenue);
  const chart = document.querySelector('[data-chart-rev]');
  if (chart) {
    chart.replaceChildren();
    days.forEach((d, i) => {
      chart.append(el('div', { class: 'chart-bar__col' },
        el('div', { class: 'chart-bar__bar', style: `height:${(revenue[i]/max)*100}%` },
          el('span', { class: 'chart-bar__val' }, fmt(revenue[i]))
        ),
        el('span', { class: 'chart-bar__label' }, d)
      ));
    });
  }
  const top = document.querySelector('[data-top-list]');
  if (top) {
    top.replaceChildren();
    const sellers = [
      { name: 'cardamom latte',    sold: 84, rev: 672 },
      { name: 'iced matcha',       sold: 56, rev: 392 },
      { name: 'apple fritter',     sold: 48, rev: 192 },
      { name: 'slow bar w/ nick',  sold: 31, rev: 279 },
      { name: 'cinnamon bun',      sold: 27, rev: 81  }
    ];
    sellers.forEach((s, i) => {
      top.append(el('div', { class: 'top-item' },
        el('span', { class: 'top-rank' }, '#' + (i+1)),
        el('div', {},
          el('div', { class: 'top-name' }, s.name),
          el('div', { class: 'top-meta' }, `${s.sold} sold this week`)
        ),
        el('span', { class: 'top-rev' }, fmt(s.rev))
      ));
    });
  }
}

function renderAccounting() {
  const tbody = document.querySelector('[data-acct-rows]');
  if (!tbody) return;
  const rows = [
    { cat: 'pour-over coffee',  rev:  1845, cost:  340, profit: 1505 },
    { cat: 'espresso drinks',   rev:  3210, cost:  720, profit: 2490 },
    { cat: 'donuts & pastries', rev:  1180, cost:  410, profit:  770 },
    { cat: 'merch (totes)',     rev:   216, cost:  120, profit:   96 }
  ];
  tbody.replaceChildren();
  let totalRev = 0, totalCost = 0, totalProfit = 0;
  for (const r of rows) {
    totalRev += r.rev; totalCost += r.cost; totalProfit += r.profit;
    tbody.append(el('tr', {},
      el('td', {}, r.cat),
      el('td', { class: 'num' }, fmt(r.rev)),
      el('td', { class: 'num' }, fmt(r.cost)),
      el('td', { class: 'num' }, fmt(r.profit)),
      el('td', { class: 'num' }, ((r.profit/r.rev)*100).toFixed(0) + '%')
    ));
  }
  tbody.append(el('tr', { class: 'total' },
    el('td', {}, 'TOTAL · this week'),
    el('td', { class: 'num' }, fmt(totalRev)),
    el('td', { class: 'num' }, fmt(totalCost)),
    el('td', { class: 'num' }, fmt(totalProfit)),
    el('td', { class: 'num' }, ((totalProfit/totalRev)*100).toFixed(0) + '%')
  ));
}

function renderEvents() {
  const list = document.querySelector('[data-events-list]');
  if (!list) return;
  list.replaceChildren();
  for (const ev of state.events) {
    list.append(el('div', { class: 'event' },
      el('div', { class: 'event__date' },
        el('div', { class: 'event__day' }, ev.day),
        el('div', { class: 'event__month' }, ev.month)
      ),
      el('div', {},
        el('div', { class: 'event__title' }, ev.title),
        el('div', { class: 'event__sub' }, ev.sub)
      ),
      el('span', { class: 'event__time' }, ev.time)
    ));
  }
}

function renderStaff() {
  const list = document.querySelector('[data-shift-list]');
  if (!list) return;
  list.replaceChildren();
  for (const p of state.staff) {
    list.append(el('div', { class: 'shift' },
      el('div', { class: 'shift__person' },
        el('div', { class: 'shift__avatar' }, p.initial),
        el('div', {},
          el('div', { class: 'shift__name' }, p.name),
          el('div', { class: 'shift__role' }, p.role)
        )
      ),
      el('span', { class: 'shift__hours' }, p.hours),
      el('span', { class: `shift__badge ${p.badgeClass}` }, p.badge)
    ));
  }
}

function renderSettings() {
  const s = state.settings;
  const set = (sel, val) => { const node = document.querySelector(sel); if (node) node.value = val; };
  set('[data-setting="address"]', s.address);
  set('[data-setting="instagram"]', s.instagram);
  set('[data-setting="pickupMin"]', s.pickupMin);
  for (const [day, hours] of Object.entries(s.hours)) {
    set(`[data-setting="hours-${day}"]`, hours);
  }
}

function renderAll() {
  renderStats();
  renderOrders();
  renderMenu();
  renderAnalytics();
  renderAccounting();
  renderEvents();
  renderStaff();
  renderSettings();
}

/* ----- Tab switching ----- */
function switchTab(name) {
  document.querySelectorAll('.admin__nav button').forEach(b => {
    b.classList.toggle('is-active', b.dataset.tab === name);
  });
  document.querySelectorAll('.admin__tab').forEach(t => {
    t.classList.toggle('is-active', t.dataset.tab === name);
  });
  const titles = {
    orders:     ['orders today',       'live pickup queue · refresh as they come in'],
    menu:       ['menu',               "edit prices, mark sold-out, set today's special"],
    analytics:  ['analytics',          "last 7 days · what's working"],
    accounting: ['accounting',         'revenue, cost, profit · this week'],
    events:     ['events',             'upcoming things at snail'],
    staff:      ['staff',              "who's on today"],
    settings:   ['settings',           'hours, location, the boring stuff']
  };
  const [t, sub] = titles[name] || ['admin', ''];
  const titleNode = document.querySelector('[data-page-title]');
  const subNode = document.querySelector('[data-page-sub]');
  if (titleNode) titleNode.textContent = t;
  if (subNode) subNode.textContent = sub;
  history.replaceState(null, '', '#' + name);
}

/* ----- Event handlers ----- */
document.addEventListener('DOMContentLoaded', () => {
  renderAll();
  const initialTab = (location.hash || '#orders').slice(1);
  switchTab(initialTab);

  document.addEventListener('click', e => {
    const tabBtn = e.target.closest('.admin__nav button');
    if (tabBtn) { switchTab(tabBtn.dataset.tab); return; }

    const advance = e.target.closest('[data-advance]')?.dataset.advance;
    if (advance) {
      const o = state.orders.find(o => o.num === advance);
      if (o) {
        o.status = o.status === 'pending' ? 'ready' : 'done';
        saveState(state);
        renderStats();
        renderOrders();
      }
    }

    const filter = e.target.closest('.orders-filter .chip');
    if (filter) {
      filter.parentElement.querySelectorAll('.chip').forEach(c => c.classList.toggle('is-active', c === filter));
      renderOrders();
    }

    const special = e.target.closest('[data-special]')?.dataset.special;
    if (special) {
      const item = state.menu.find(m => m.id === special);
      if (item) {
        state.menu.forEach(m => m.todaySpecial = false);
        item.todaySpecial = true;
        saveState(state);
        renderMenu();
      }
    }
  });

  document.addEventListener('change', e => {
    const card = e.target.closest('.menu-edit');
    if (card) {
      const item = state.menu.find(m => m.id === card.dataset.id);
      if (!item) return;
      const field = e.target.dataset.field;
      if (field === 'price') item.price = parseFloat(e.target.value) || 0;
      if (field === 'available') item.available = e.target.checked;
      saveState(state);
      renderMenu();
      return;
    }
    const setting = e.target.closest('[data-setting]');
    if (setting) {
      const key = setting.dataset.setting;
      if (key.startsWith('hours-')) {
        const day = key.replace('hours-', '');
        state.settings.hours[day] = setting.value;
      } else if (key === 'pickupMin') {
        state.settings.pickupMin = parseInt(setting.value) || 10;
      } else {
        state.settings[key] = setting.value;
      }
      saveState(state);
    }
  });

  document.querySelector('[data-reset]')?.addEventListener('click', () => {
    if (confirm('Reset the demo data? (this only affects this browser)')) {
      state = structuredClone(SEED);
      saveState(state);
      renderAll();
    }
  });
});

window.SnailAdmin = { state, renderAll, saveState, ORDER_PRIORITY };
