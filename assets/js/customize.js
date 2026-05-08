/* =========================================================
   Snail — Customize modal
   Drink customization (size, milk, shots, flavors) + cart edit flow
   ========================================================= */

const CUSTOMIZATIONS = {
  groups: {
    size: {
      label: 'size',
      type: 'single',
      options: [
        { id: 'sm', name: '8oz',  delta: -1 },
        { id: 'md', name: '12oz', delta: 0, default: true },
        { id: 'lg', name: '16oz', delta: 1.5 }
      ]
    },
    milk: {
      label: 'milk',
      type: 'single',
      options: [
        { id: 'whole',  name: 'whole',  delta: 0, default: true },
        { id: 'oat',    name: 'oat',    delta: 0.75 },
        { id: 'almond', name: 'almond', delta: 0.75 },
        { id: 'soy',    name: 'soy',    delta: 0.75 }
      ]
    },
    shots: {
      label: 'extra shots',
      type: 'single',
      options: [
        { id: '0', name: 'standard', delta: 0, default: true },
        { id: '1', name: '+1 shot',  delta: 1 },
        { id: '2', name: '+2 shots', delta: 2 }
      ]
    },
    flavors: {
      label: 'flavors',
      type: 'multi',
      options: [
        { id: 'vanilla',  name: 'vanilla',  delta: 0.5 },
        { id: 'lavender', name: 'lavender', delta: 0.75 },
        { id: 'cardamom', name: 'cardamom', delta: 0.5 },
        { id: 'honey',    name: 'honey',    delta: 0.5 }
      ]
    }
  },

  // which groups apply to which item id
  items: {
    'cardamom-latte': ['size', 'milk', 'shots', 'flavors'],
    'espresso':       ['shots'],
    'americano':      ['size', 'shots', 'flavors'],
    'cortado':        ['shots'],
    'cappuccino':     ['size', 'milk', 'shots', 'flavors'],
    'latte':          ['size', 'milk', 'shots', 'flavors'],
    'drip':           ['size', 'milk'],
    'iced-matcha':    ['size', 'milk', 'flavors'],
    'honey-lavender': ['size', 'milk', 'shots']
  }
};

function isCustomizable(id) {
  const groups = CUSTOMIZATIONS.items[id];
  return Array.isArray(groups) && groups.length > 0;
}

function defaultOptionsFor(id) {
  const groups = CUSTOMIZATIONS.items[id] || [];
  const opts = {};
  for (const g of groups) {
    const def = CUSTOMIZATIONS.groups[g];
    if (def.type === 'single') {
      const d = def.options.find(o => o.default) || def.options[0];
      opts[g] = d.id;
    } else {
      opts[g] = []; // multi defaults to none
    }
  }
  return opts;
}

function priceWithOptions(basePrice, id, options) {
  const groups = CUSTOMIZATIONS.items[id] || [];
  let total = basePrice;
  for (const g of groups) {
    const def = CUSTOMIZATIONS.groups[g];
    const sel = options?.[g];
    if (def.type === 'single') {
      const opt = def.options.find(o => o.id === sel);
      if (opt) total += opt.delta;
    } else if (Array.isArray(sel)) {
      for (const optId of sel) {
        const opt = def.options.find(o => o.id === optId);
        if (opt) total += opt.delta;
      }
    }
  }
  return Math.max(0, total);
}

// Stable key from options object
function optionsKey(options) {
  if (!options) return '';
  const keys = Object.keys(options).sort();
  return keys.map(k => `${k}=${Array.isArray(options[k]) ? options[k].slice().sort().join(',') : options[k]}`).join('|');
}

function lineKey(id, options) {
  const k = optionsKey(options);
  return k ? `${id}#${k}` : id;
}

function summarizeOptions(id, options) {
  const groups = CUSTOMIZATIONS.items[id] || [];
  const parts = [];
  for (const g of groups) {
    const def = CUSTOMIZATIONS.groups[g];
    const sel = options?.[g];
    if (def.type === 'single') {
      const opt = def.options.find(o => o.id === sel);
      if (opt && !opt.default) parts.push(opt.name);
    } else if (Array.isArray(sel) && sel.length) {
      for (const optId of sel) {
        const opt = def.options.find(o => o.id === optId);
        if (opt) parts.push(opt.name);
      }
    }
  }
  return parts.join(' · ');
}

/* ---------------- Modal ---------------- */
const Customizer = (() => {
  let current = null; // { id, name, basePrice, sub, emoji, options, editingKey }

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

  function fmt(n) { return `$${n.toFixed(2)}`; }
  function fmtDelta(d) {
    if (d === 0) return '';
    return d > 0 ? `+$${d.toFixed(2)}` : `−$${Math.abs(d).toFixed(2)}`;
  }

  function render() {
    const groups = CUSTOMIZATIONS.items[current.id] || [];
    const titleEl = document.querySelector('[data-modal-title]');
    const descEl = document.querySelector('[data-modal-desc]');
    const groupsEl = document.querySelector('[data-modal-groups]');
    const totalEl = document.querySelector('[data-modal-total]');
    const confirmBtn = document.querySelector('[data-modal-confirm]');
    const removeBtn = document.querySelector('[data-modal-remove]');

    titleEl.textContent = current.name;
    descEl.textContent = current.sub || '';

    groupsEl.replaceChildren();
    for (const g of groups) {
      const def = CUSTOMIZATIONS.groups[g];
      const wrap = el('div', { class: 'opt-group' },
        el('h3', { class: 'opt-group__label' }, def.label));
      const optsRow = el('div', { class: 'opt-group__options' });
      for (const opt of def.options) {
        const isSel = def.type === 'single'
          ? current.options[g] === opt.id
          : (current.options[g] || []).includes(opt.id);
        const pill = el('button', {
          type: 'button',
          class: 'opt-pill' + (isSel ? ' is-selected' : ''),
          data: { optGroup: g, optId: opt.id, optType: def.type }
        }, opt.name);
        if (opt.delta !== 0) {
          pill.append(el('span', { class: 'opt-delta' }, fmtDelta(opt.delta)));
        }
        optsRow.append(pill);
      }
      wrap.append(optsRow);
      groupsEl.append(wrap);
    }

    totalEl.textContent = fmt(priceWithOptions(current.basePrice, current.id, current.options));

    // Editing existing line — show "remove from bag" + change "add" → "save"
    if (current.editingKey) {
      confirmBtn.textContent = 'save changes';
      removeBtn.style.display = '';
    } else {
      confirmBtn.textContent = 'add to bag';
      removeBtn.style.display = 'none';
    }
  }

  function open(item, opts = {}) {
    current = {
      id: item.id,
      name: item.name,
      basePrice: parseFloat(item.basePrice ?? item.price),
      sub: item.sub,
      emoji: item.emoji,
      options: opts.options ? structuredClone(opts.options) : defaultOptionsFor(item.id),
      editingKey: opts.editingKey || null
    };
    render();
    const modal = document.querySelector('[data-modal]');
    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => modal.classList.add('is-open'));
  }

  function close() {
    const modal = document.querySelector('[data-modal]');
    modal.classList.remove('is-open');
    setTimeout(() => modal.setAttribute('hidden', ''), 250);
    document.body.style.overflow = '';
    current = null;
  }

  function togglePill(group, optId, type) {
    if (!current) return;
    if (type === 'single') {
      current.options[group] = optId;
    } else {
      const arr = current.options[group] || [];
      const i = arr.indexOf(optId);
      if (i >= 0) arr.splice(i, 1);
      else arr.push(optId);
      current.options[group] = arr;
    }
    render();
  }

  function confirm() {
    if (!current) return;
    const finalPrice = priceWithOptions(current.basePrice, current.id, current.options);
    const sum = summarizeOptions(current.id, current.options);
    const lineItem = {
      id: current.id,
      name: current.name,
      basePrice: current.basePrice,
      price: finalPrice,
      sub: sum || current.sub || '',
      emoji: current.emoji,
      options: current.options,
      key: lineKey(current.id, current.options)
    };

    if (current.editingKey) {
      window.SnailCart.replaceLine(current.editingKey, lineItem);
    } else {
      window.SnailCart.add(lineItem);
    }
    if (typeof window.snailToast === 'function') {
      window.snailToast(`${lineItem.name} → bag`);
    }
    close();
  }

  function removeLine() {
    if (!current?.editingKey) return;
    window.SnailCart.removeKey(current.editingKey);
    if (typeof window.snailToast === 'function') {
      window.snailToast(`removed from bag`);
    }
    close();
  }

  return { open, close, togglePill, confirm, removeLine, isCustomizable, defaultOptionsFor, priceWithOptions, summarizeOptions, lineKey };
})();

window.SnailCustomize = Customizer;

/* ---------------- Wiring ---------------- */
document.addEventListener('DOMContentLoaded', () => {

  // Hijack any [data-add] click on a customizable item
  document.addEventListener('click', e => {
    const addBtn = e.target.closest('[data-add]');
    if (!addBtn) return;
    const id = addBtn.dataset.id;
    if (!isCustomizable(id)) return; // let cart.js handle it normally
    e.stopImmediatePropagation();
    e.preventDefault();
    Customizer.open({
      id,
      name: addBtn.dataset.name,
      basePrice: parseFloat(addBtn.dataset.price),
      sub: addBtn.dataset.sub,
      emoji: addBtn.dataset.emoji
    });
  }, true); // capture phase to beat cart.js

  // Modal interactions
  document.addEventListener('click', e => {
    if (e.target.closest('[data-modal-close]')) Customizer.close();
    if (e.target.closest('[data-modal-confirm]')) Customizer.confirm();
    if (e.target.closest('[data-modal-remove]')) Customizer.removeLine();

    const pill = e.target.closest('.opt-pill');
    if (pill) {
      Customizer.togglePill(pill.dataset.optGroup, pill.dataset.optId, pill.dataset.optType);
    }

    // Cart line edit button
    const editBtn = e.target.closest('.cart-line__edit');
    if (editBtn) {
      const line = editBtn.closest('.cart-line');
      const key = line.dataset.key;
      const item = window.SnailCart.getAll().find(i => (i.key || i.id) === key);
      if (item && isCustomizable(item.id)) {
        Customizer.open({
          id: item.id,
          name: item.name,
          basePrice: item.basePrice ?? item.price,
          sub: item.sub,
          emoji: item.emoji
        }, { options: item.options, editingKey: key });
      }
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const modal = document.querySelector('[data-modal]');
      if (modal && !modal.hasAttribute('hidden')) Customizer.close();
    }
  });
});
