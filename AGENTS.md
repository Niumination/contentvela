# contentvela — Content Creator Workspace

Static-first content workflow app: idea → draft → publish → analytics.
Milik ekosistem **Niumination**, dibangun di server **LightVela** (cloud).
Semua data di `localStorage` browser; tidak ada backend, tidak ada autentikasi.

Dokumentasi lengkap: `README.md`. Status ekosistem: `~/niumination/brain/docs/lightvela-cloud-ekosistem.md`.

## Perintah

```bash
npm run dev      # dev server di 127.0.0.1:5189
npm test         # vitest run — WAJIB lolos sebelum commit
npm run build    # tsc -b && vite build
npm run lint     # oxlint
npm run preview  # serve dist/ (BUTUH BASE_PATH yang sesuai saat build)
```

## Aturan main

1. **Test dulu, baru commit.** `npm test` harus hijau. Tambah test untuk setiap
   utilitas atau aksi store baru — tidak ada pengecualian.
2. **Jangan tambah dependency tanpa alasan.** Recharts sudah cukup berat
   (410 kB); lazy-load grafik baru, jangan taruh di initial bundle.
3. **`localStorage` adalah database.** Chaque entiti wajib bertimestamp ISO-8601
   supaya state bisa di-diff dan di-backup. Naikkan `version` di config `persist`
   bila bentuk data berubah, dan tulis `migrate`.
4. **Markdown lewat `renderMarkdown`** dari `src/shared/utils.ts` — jangan
   `dangerouslySetInnerHTML` dengan HTML mentah dari user. Fungsi itu sudah
   escape HTML dan menambah `rel="noreferrer"` pada link.
5. **Base path tidak di-hard-code.** Pakai env `BASE_PATH` saat build; CI
   mengesetnya dari nama repo. Hard-code `/contentvela/` bikin build lokal rusak.
6. **Tanpa API platform.** Post hanya dicatat manual. Kalau suatu saat menambah
   connector API, taruh di `src/shared/` dan jangan ubah model data.
7. **Bahasa UI: Indonesia.** Label, empty-state, dan komentar dalam kode juga
   bahasa Indonesia. Istilah teknis (draft, publish, analytics) dibiarkan.

### Registry npm — penting

`package-lock.json` di repo ini sengaja di-*generate* terhadap
`https://registry.npmjs.org/`, bukan registry default mesin.

Mesin ini punya `registry=https://mirrors.tencentyun.com/npm/` di `~/.npmrc`,
dan `npm install` akan membekukan URL mirror itu ke `resolved` di lockfile.
GitHub Actions tidak bisa menjangkau mirror tersebut, jadi CI gagal
`ENOTFOUND mirrors.tencentyun.com`.

Kalau lockfile perlu di-refresh ulang:

```bash
npm install --registry=https://registry.npmjs.org/
```

Setelah itu, jangan pernah `npm install` tanpa `--registry` di repo ini.

## Konvensi kode

- TypeScript strict, tanpa `any`. Union literal untuk enum (`type DraftStatus`).
- Fungsi utilitas murni + satu unit test file per modul (`*.test.ts`).
- Nama file komponen = `PascalCase.tsx`, utilitas = `camelCase.ts`.
- Tailwind v4: warna lewat token `@theme` di `index.css` (`vela-*` = amber,
  `ink-*` = slate). Jangan tulis hex mentah di JSX.
- Aksesibilitas: tombol harus punya teks atau `title`, input wajib ber-`label`.

## Deploy

Push ke `main` → `.github/workflows/deploy.yml` (test → build → Pages).
Verifikasi lokal dengan `BASE_PATH=/contentvela/ npm run build && npm run preview`
sebelum push.

## Yang belum ada (bukan bug)

Ekspor/impor JSON, autentikasi, multi-platform API sync, WYSIWYG editor,
scheduled publishing otomatis.
