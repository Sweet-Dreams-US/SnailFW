/* =========================================================
   Snail — Cart
   localStorage-backed pub-sub. Supports customized line items
   keyed by id + options hash so two cardamom lattes with
   different milks are separate lines.
   ========================================================= */

const STORAGE_KEY = 'snail.cart.v2';

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
  function keyOf(item) { return item.key || item.id; }

  /**
   * Add an item. Items with the same `key` (id + customization hash)
   * merge by incrementing qty.
   */
  function add(item) {
    const k = keyOf(item);
    const existing = items.find(i => keyOf(i) === k);
    if (existing) {
      existing.qty += 1;
    } else {
      items.push({ ...item, qty: 1 });
    }
    save();
  }

  function setQty(key, qty) {
    const line = items.find(i => keyOf(i) === key);
    if (!line) return;
    line.qty = Math.max(0, qty);
    if (line.qty === 0) items = items.filter(i => keyOf(i) !== key);
    save();
  }

  function removeKey(key) {
    items = items.filter(i => keyOf(i) !== key);
    save();
  }

  /**
   * Replace a line (used when user edits customization).
   * Preserves quantity. If the new key matches an existing line,
   * merges into it.
   */
  function replaceLine(oldKey, newItem) {
    const oldLine = items.find(i => keyOf(i) === oldKey);
    if (!oldLine) { add(newItem); return; }
    const oldQty = oldLine.qty;
    items = items.filter(i => keyOf(i) !== oldKey);
    const newKey = keyOf(newItem);
    const merged = items.find(i => keyOf(i) === newKey);
    if (merged) {
      merged.qty += oldQty;
    } else {
      items.push({ ...newItem, qty: oldQty });
    }
    save();
  }

  function clear() { items = []; save(); }
  function total() { return items.reduce((acc, i) => acc + i.price * i.qty, 0); }
  function count() { return items.reduce((acc, i) => acc + i.qty, 0); }
  function getAll() { return items.slice(); }
  function subscribe(fn) { subs.add(fn); fn(items); return () => subs.delete(fn); }

  return { add, setQty, removeKey, replaceLine, clear, total, count, getAll, subscribe };
})();

/* ---------------- Rendering ---------------- */
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
    const k = line.key || line.id;
    const isCustomizable = window.SnailCustomize?.isCustomizable?.(line.id);
    const card = el('div', { class: 'cart-line', data: { key: k } },
      el('div', { class: 'cart-mark' }, line.emoji || '🐌'),
      el('div', {},
        el('div', { class: 'cart-line__name' }, line.name),
        line.sub ? el('div', { class: 'cart-line__sub' }, line.sub) : null,
        el('div', { class: 'cart-line__qty' },
          el('button', { type: 'button', data: { act: 'dec' }, 'aria-label': 'Decrease' }, '−'),
          el('span', {}, line.qty),
          el('button', { type: 'button', data: { act: 'inc' }, 'aria-label': 'Increase' }, '+'),
        ),
      ),
      el('div', { class: 'cart-line__right' },
        el('div', { class: 'cart-line__price' }, fmt(line.price * line.qty)),
        el('div', { class: 'cart-line__actions' },
          isCustomizable ? el('button', { type: 'button', class: 'cart-line__edit' }, 'edit') : null,
          el('button', { type: 'button', class: 'cart-line__remove', data: { act: 'rm' }, 'aria-label': 'Remove' }, 'remove'),
        ),
      ),
    );
    list.append(card);
  }

  if (totalEl) totalEl.textContent = fmt(Cart.total());
}

/* Drawer + toast */
function openDrawer() {
  document.querySelector('[data-cart-drawer]')?.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}
function closeDrawer() {
  document.querySelector('[data-cart-drawer]')?.classList.remove('is-open');
  document.body.style.overflow = '';
}
let toastTimer;
function toast(msg) {
  const node = document.querySelector('[data-toast]');
  if (!node) return;
  node.textContent = msg;
  node.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('is-on'), 2000);
}
window.snailToast = toast;

/* Init */
document.addEventListener('DOMContentLoaded', () => {
  Cart.subscribe(items => {
    renderCount(items);
    renderDrawer(items);
  });

  // Plain add-to-bag for non-customizable items
  document.addEventListener('click', e => {
    const addBtn = e.target.closest('[data-add]');
    if (addBtn) {
      // If customizable, customize.js handled it (capture-phase preventDefault)
      if (window.SnailCustomize?.isCustomizable?.(addBtn.dataset.id)) return;
      const item = {
        id:    addBtn.dataset.id,
        name:  addBtn.dataset.name,
        price: parseFloat(addBtn.dataset.price),
        basePrice: parseFloat(addBtn.dataset.price),
        sub:   addBtn.dataset.sub,
        emoji: addBtn.dataset.emoji,
        key:   addBtn.dataset.id
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

    // qty + remove on cart lines
    const lineBtn = e.target.closest('.cart-line button[data-act]');
    if (lineBtn) {
      const line = lineBtn.closest('.cart-line');
      const key = line.dataset.key;
      const act = lineBtn.dataset.act;
      const item = Cart.getAll().find(i => (i.key || i.id) === key);
      if (!item) return;
      if (act === 'inc') Cart.setQty(key, item.qty + 1);
      if (act === 'dec') Cart.setQty(key, item.qty - 1);
      if (act === 'rm')  Cart.removeKey(key);
    }

    // checkout
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
