# 🐌 snail — website demo

Cozy local café in West Central, Fort Wayne. 725 Union St. Regular hours start May 11.

This is a **static, build-free website demo** — no framework, no install step, no deploy config. Open `index.html` in any browser, or drop the folder onto Vercel / Netlify / GitHub Pages and it just works.

## Stack

- **HTML5** — four pages: home, menu, story, visit
- **CSS3** — three stylesheets in `assets/css/` (base tokens, components, page layouts), Google Fonts (Bagel Fat One / Fraunces / Caveat)
- **Vanilla JS** — one cart module backed by `localStorage`, one nav/scrollspy helper, no dependencies
- **Higgsfield AI** — hero photography (matcha, snail-stamped cup, donut spread) generated via `nano_banana_2`, optimized to WebP

## Running locally

```bash
# any tiny static server works — for example:
python -m http.server 8000
# then visit http://127.0.0.1:8000
```

Or simply open `index.html` directly.

## File map

```
website/
├── index.html        # home — hero, story, highlights, menu preview, visit teaser
├── menu.html         # full menu — coffee, signature, donuts, extras
├── story.html        # the brand story
├── visit.html        # hours, directions, embedded map, amenities
├── assets/
│   ├── css/
│   │   ├── base.css         # tokens, typography, paper-grain bg, reveal-on-scroll
│   │   ├── components.css   # nav, buttons, polaroid cards, item cards, cart drawer, footer
│   │   └── pages.css        # hero, marquee, story, highlights, menu, visit
│   ├── js/
│   │   ├── cart.js          # localStorage cart + drawer + toast
│   │   └── main.js          # active nav, marquee duplicator, reveal observer, scrollspy
│   └── img/
│       ├── snail-logo.png       # AI-generated olive silhouette mascot
│       ├── snail-wordmark.png   # "snail" bubble wordmark
│       ├── snail-bubble.jpg     # alt bubble logo (lilac)
│       ├── matcha.webp          # AI-generated · iced matcha
│       ├── snail-cup.webp       # AI-generated · snail-stamped cup
│       └── donuts.webp          # AI-generated · donut flat-lay
└── source-assets/    # original phone-snap photos & logos provided by client
```

## Design system

Brand pulled from the source assets and Insta bio (`@snail.fw`):

| Token              | Hex        | Use                                |
| ------------------ | ---------- | ---------------------------------- |
| `--cream` / `--cream-2` / `--cream-3` | `#F0E5C8` / `#E8DBB8` / `#DCCCA0` | Page bg + warm depth |
| `--paper`          | `#F7EFD8`  | Cards, drawer panel                |
| `--olive` / `--olive-deep` / `--olive-ink` | `#7A6A3F` / `#5A4F2D` / `#3A311C` | Wordmark, body, ink |
| `--matcha` / `--matcha-deep` | `#A8C77B` / `#84A653` | Accent, signature drink |
| `--lilac` / `--lilac-deep` | `#D4C5E0` / `#B69BCC` | Accent, blob shapes |
| `--brick` / `--brick-deep` | `#D74A36` / `#B33620` | Handwritten scribbles, CTAs |

Type stack:
- **Display** — `Bagel Fat One` (chunky bubble, mirrors the wordmark)
- **Body** — `Fraunces` (warm soft-serif, optical sizing)
- **Hand** — `Caveat` (matches the red menu scribble)

## Cart

The cart is a tiny pub-sub module in [`assets/js/cart.js`](assets/js/cart.js) that persists to `localStorage` under the key `snail.cart.v1`. Any HTML page that includes `cart.js` automatically:

- Wires every `[data-add]` button as an add-to-bag action.
- Updates every `[data-cart-count]` badge.
- Syncs every `[data-cart-drawer]` panel.

To add a menu item anywhere on the site, just write:

```html
<button class="item-card__add"
  data-add
  data-id="cardamom-latte"
  data-name="cardamom latte"
  data-price="8"
  data-sub="cardamom · vanilla bean"
  data-emoji="🍵">
  <span>add to bag</span>
</button>
```

That's it — no JS imports, no per-page wiring.

## Mobile

- Body has `overflow-x: hidden` as a hard guard against side-scroll.
- The persistent top nav (no hamburger) uses a horizontally scrollable pill strip — all links visible at all times, snap to the nearest pill on touch.
- All grid layouts collapse to a single column at 900px and 640px breakpoints.
- The cart drawer is `min(420px, 92vw)` so it never escapes the viewport.

## Deploying

Drop the folder on Vercel / Netlify / GitHub Pages — no config required.

```bash
# Vercel
vercel --prod

# GitHub Pages
git push origin main      # then enable Pages in repo settings, branch: main, folder: /
```

## License

© 2026 snail · west central · fort wayne 🐌
