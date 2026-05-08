/* =========================================================
   Snail — Cart
   localStorage-backed, lightweight pub-sub
   ========================================================= */

const STORAGE_KEY = 'snail.cart.v1';

const Cart = (() => {
  let items = load();
  const subs = new Set();

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch { return []; }
  }
  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    subs.forEach(fn => fn(items));
  }

  /**
   * Add an item to the cart. If the same id is in the bag, increment qty.
   * @param {{id:string,name:string,price:number,sub?:string,emoji?:string}} item
   */
  function add(item) {
    const existing = items.find(i => i.id === item.id);
    if (existing) {
      existing.qty += 1;
    } else {
      items.push({ ...item, qty: 1 });
    }
    save();
  }

  function setQty(id, qty) {
    const line = items.find(i => i.id === id);
    if (!line) return;
    line.qty = Math.max(0, qty);
    if (line.qty === 0) items = items.filter(i => i.id !== id);
    save();
  }

  function remove(id) {
    items = items.filter(i => i.id !== id);
    save();
  }
  function clear() { items = []; save(); }
  function total() { return items.reduce((acc, i) => acc + i.price * i.qty, 0); }
  function count() { return items.reduce((acc, i) => acc + i.qty, 0); }
  function getAll() { return items.slice(); }

  function subscribe(fn) {
    subs.add(fn);
    fn(items);
    return () => subs.delete(fn);
  }

  return { add, setQty, remove, clear, total, count, getAll, subscribe };
})();

/* ----------- DOM rendering (safe-by-construction, no innerHTML) ----------- */
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

function renderCount(items) {
  const els = document.querySelectorAll('[data-cart-count]');
  const c = items.reduce((a, i) => a + i.qty, 0);
  els.forEach(node => {
    node.textContent = c;
    node.style.display = c > 0 ? 'inline-grid' : 'none';
  });
}

function renderDrawer(items) {
  const list = document.querySelector('[data-cart-list]');
  const empty = document.querySelector('[data-cart-empty]');
  const totalEl = document.querySelector('[data-cart-total]');
  const checkoutBtn = document.querySelector('[data-cart-checkout]');
  if (!list) return;

  list.replaceChildren();

  if (!items.length) {
    if (empty) empty.style.display = 'block';
    if (checkoutBtn) checkoutBtn.disabled = true;
    if (totalEl) totalEl.textContent = '$0.00';
    return;
  }
  if (empty) empty.style.display = 'none';
  if (checkoutBtn) checkoutBtn.disabled = false;

  for (const line of items) {
    const card = el('div', { class: 'cart-line', data: { id: line.id } },
      el('div', { class: 'cart-mark' }, line.emoji || '🐌'),
      el('div', {},
        el('div', { class: 'cart-line__name' }, line.name),
        el('div', { class: 'cart-line__sub' }, line.sub || fmt(line.price)),
        el('div', { class: 'cart-line__qty' },
          el('button', { data: { act: 'dec' }, 'aria-label': 'Decrease' }, '−'),
          el('span', {}, line.qty),
          el('button', { data: { act: 'inc' }, 'aria-label': 'Increase' }, '+'),
        ),
      ),
      el('div', { style: 'text-align:right' },
        el('div', { style: 'font-family:var(--font-display);font-size:1.1rem;color:var(--olive-ink)' },
          fmt(line.price * line.qty)),
        el('button', { class: 'cart-line__remove', data: { act: 'rm' }, 'aria-label': 'Remove' }, 'remove'),
      ),
    );
    list.append(card);
  }

  if (totalEl) totalEl.textContent = fmt(Cart.total());
}

/* Drawer open/close */
function openDrawer() {
  document.querySelector('[data-cart-drawer]')?.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}
function closeDrawer() {
  document.querySelector('[data-cart-drawer]')?.classList.remove('is-open');
  document.body.style.overflow = '';
}

/* Toast */
let toastTimer;
function toast(msg) {
  const node = document.querySelector('[data-toast]');
  if (!node) return;
  node.textContent = msg;
  node.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('is-on'), 2000);
}

/* Init */
document.addEventListener('DOMContentLoaded', () => {
  Cart.subscribe(items => {
    renderCount(items);
    renderDrawer(items);
  });

  document.addEventListener('click', e => {
    const addBtn = e.target.closest('[data-add]');
    if (addBtn) {
      const item = {
        id:    addBtn.dataset.id,
        name:  addBtn.dataset.name,
        price: parseFloat(addBtn.dataset.price),
        sub:   addBtn.dataset.sub,
        emoji: addBtn.dataset.emoji
      };
      Cart.add(item);
      addBtn.classList.add('is-added');
      addBtn.replaceChildren(el('span', {}, 'added ✓'));
      setTimeout(() => {
        addBtn.classList.remove('is-added');
        addBtn.replaceChildren(el('span', {}, 'add to bag'));
      }, 1400);
      toast(`${item.name} → bag`);
    }

    if (e.target.closest('[data-cart-open]')) openDrawer();
    if (e.target.closest('[data-cart-close]')) closeDrawer();
    if (e.target.matches('[data-cart-drawer] .cart-drawer__scrim')) closeDrawer();

    const lineBtn = e.target.closest('.cart-line button');
    if (lineBtn) {
      const line = lineBtn.closest('.cart-line');
      const id = line.dataset.id;
      const act = lineBtn.dataset.act;
      const item = Cart.getAll().find(i => i.id === id);
      if (!item) return;
      if (act === 'inc') Cart.setQty(id, item.qty + 1);
      if (act === 'dec') Cart.setQty(id, item.qty - 1);
      if (act === 'rm')  Cart.remove(id);
    }

    if (e.target.closest('[data-cart-checkout]')) {
      if (Cart.count() === 0) return;
      toast(`Sending order — pickup at 725 Union St 🌸`);
      setTimeout(() => {
        Cart.clear();
        closeDrawer();
      }, 1500);
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDrawer();
  });
});

window.SnailCart = Cart;
