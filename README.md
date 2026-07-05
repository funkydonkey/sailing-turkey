# Sailing Turkey — Göcek & Fethiye Promo Website

A mobile-first promotional / crew-finding website for a sailing trip on Turkey's
Turquoise Coast: **Göcek → the Gulf of Fethiye → Göcek**. Bilingual (RU/EN),
built from the same template as the Sardinia site with a turquoise/teal theme.

Route highlights: Göcek's Twelve Islands, Bedri Rahmi (Wall) Bay, Tomb Bay's
Lycian rock tombs, the town of Fethiye, Gemiler (St. Nicholas) Island, Ölüdeniz
and pine-clad anchorages. ~60 nautical miles, 7 nights.

## Features

- **Mobile-First Design**: Optimized for iOS and Android with safe-area support
- **PWA Ready**: Installable via `manifest.json`
- **Bilingual**: RU/EN toggle, all copy lives in `content.json`
- **Interactive Gallery**: Swipeable lightbox
- **Tab Navigation**: Gallery, Boat, Route (Leaflet map), Info
- **Accessible**: ARIA labels, keyboard navigation, reduced-motion support

## Tech Stack

- **HTML5** + **Tailwind CSS** (CDN)
- **Vanilla JavaScript** (`js/app.js`) — no build step
- **Leaflet** for the route map
- **PWA** manifest

## Project Structure

```
sailing-turkey/
├── index.html          # Structure + Tailwind theme (turquoise palette)
├── content.json        # All copy (ru + en): route, FAQ, gallery, prices
├── manifest.json       # PWA manifest
├── js/
│   └── app.js          # Tabs, gallery, FAQ, Leaflet route map + markers
└── images/
    ├── turkey/         # Gallery photos (coast-01..07)
    └── trips/          # "Life on board" photos from past trips
```

## ⚠️ Placeholder content to replace

This site was forked from the Sardinia project and re-themed for Turkey. A few
things are **placeholders** and should be confirmed/updated:

- **Photos** (`images/turkey/*.jpg`, `images/trips/*.jpg`): currently generic
  Mediterranean shots reused from past trips. Replace with real **Göcek /
  Fethiye** photos (see gallery captions in `content.json`).
- **Dates** (`ui.dates`) — placeholder: *5–12 September 2026*.
- **Price** (`price.perPerson`) — placeholder: *€950*.
- **Boat** (`tabs.boat`) — still the Sardinia charter (Beneteau Oceanis 46.1)
  with photos from `yachtsbt.com`. Swap for the actual Turkey charter.
- **Telegram** CTA points to `t.me/molchansky`.

## Editing content

Everything visible is driven by `content.json` (two blocks: `ru` and `en`).
Change route days, FAQ, prices and gallery captions there. Map coordinates,
stop names and route colours live in `js/app.js` (`initRouteMap`).

### Changing colours

Edit the Tailwind config in `index.html` (`tailwind.config → theme.extend.colors`).
The current theme is teal/turquoise (`--primary #0a4d54`) with a terracotta
accent (`--tertiary #a85a2c`). The map polyline/marker colours are also set in
`js/app.js` (search for `#0a4d54`).

## Running Locally

```bash
python -m http.server 8000
# open http://localhost:8000
```

## Deploying

Static site — drop on Netlify/Vercel/Cloudflare Pages, or enable **GitHub Pages**
(the OG/`meta` URLs assume `https://funkydonkey.github.io/sailing-turkey/`).

## License

MIT — reuse freely for your own sailing adventures.
