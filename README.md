# contentvela

**Content Creator Workspace** - workflow konten dari ide sampai analitik:
`idea -> draft -> publish -> analytics`.

Dibuat di server LightVela (cloud) sebagai pasangan dari ekosistem Niumination.
100% client-side: data disimpan di `localStorage` browser, tidak ada backend.

## Stack

| Lapisan   | Pilihan                        | Alasan                                                          |
| --------- | ------------------------------ | --------------------------------------------------------------- |
| Framework | React 19 + Vite 8 + TypeScript | Output static murni, HMR cepat, satu bahasa dengan ekosistem     |
| Styling   | Tailwind CSS v4 (token @theme) | Token warna terpusat di `src/index.css`                          |
| State     | Zustand + middleware `persist` | Satu store, rehydrate otomatis dari localStorage                 |
| Routing   | React Router v7 (HashRouter)   | GitHub Pages tak butuh rewrite server                            |
| Charts    | Recharts 3 (lazy-loaded)       | Tree-shakable; di-code-split agar tak masuk initial payload       |
| Testing   | Vitest + jsdom                 | Cek utilitas & logika store tanpa browser penuh                  |
| Deploy    | GitHub Actions -> Pages        | Static, gratis, base path mengikuti nama repo                     |

## Menjalankan

```bash
npm install
npm run dev      # http://127.0.0.1:5189
npm test         # vitest run
npm run build    # tsc -b && vite build
npm run preview  # serve hasil build
```

### Base path

`vite.config.ts` membaca env `BASE_PATH` (default `/`). Untuk build yang diserve
di `https://<user>.github.io/contentvela/`:

```bash
BASE_PATH=/contentvela/ npm run build
```

CI mengeset env ini otomatis dari `github.event.repository.name`, jadi tidak
perlu hard-code nama repo di dalam kode.

## Struktur

```
src/
  shared/
    types.ts        # domain model: Idea, Draft, PublishedPost, Metrics, Platform
    store.ts        # Zustand persist (key `contentvela.v1`) + seed data
    utils.ts        # format angka/tanggal, charUsage, renderMarkdown, parseTags
    components.tsx  # UI kit: Button, Card, Badge, Stat, Input, Textarea
    Layout.tsx      # shell + navigasi
    store.test.ts   # logika store: lifecycle ide/draft/post + roll-up metrik
    utils.test.ts   # format, char budget, markdown, escaping HTML
  pages/
    Dashboard.tsx   # ringkasan pipeline + stat
    Ideas.tsx       # board ide (inbox -> backlog -> drafting -> ready)
    Drafts.tsx      # editor markdown + preview + budget karakter + versi
    Publish.tsx     # antrean per platform, tandai terbit, input metrik
    Analytics.tsx   # bar/pie/line + konten teratas (lazy-loaded)
  App.tsx           # HashRouter + lazy route
  index.css         # token @theme Tailwind v4
```

## Model data

```ts
Idea    { id, title, notes, tags[], status, sourceUrl?, createdAt, updatedAt }
Draft   { id, ideaId|null, title, body(md), platforms[], tags[], status,
          versions[{at,title,body,chars}], scheduledAt|null, createdAt, updatedAt }
Post    { id, draftId, platform, status, url|null, publishedAt|null, metrics }
Metrics { views, likes, comments, shares }
```

Semua entiti bertimestamp ISO-8601 supaya hasil `JSON.stringify` stabil dan
bisa di-diff.

Status pipeline: ide `inbox | backlog | drafting | ready`, draft
`outline | writing | review | approved`, post `scheduled | published | failed`.

## Batasan yang disengaja (MVP)

- **Tidak memanggil API platform mana pun** (Meta Graph, TikTok Content API,
  YouTube Data API, LinkedIn API). Metrik diisi manual; connector API bisa
  ditambahkan di `src/shared/` tanpa mengubah model data.
- Tidak ada autentikasi - aplikasi ini single-user per browser.
- Ekspor/impor JSON belum ada.

## Deploy

Push ke `main` memicu `.github/workflows/deploy.yml`:
install -> `npm test` -> build dengan `BASE_PATH` -> upload artifact -> deploy.

Aktifkan di repo: **Settings -> Pages -> Source: GitHub Actions**.

Setelah aktif, app tersedia di `https://niumination.github.io/contentvela/`.
