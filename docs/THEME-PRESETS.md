# Theme presets

Bundled, ready-to-apply themes that show how far the same command-center layout
can be reskinned by editing content alone (palette + fonts — no code). Each
preset in `src/content/theme-presets/` is a complete `theme.json` (both light and
dark palettes, plus its font pairing served via Google Fonts).

## Apply one

```bash
npm run theme:preset <name>     # e.g. npm run theme:preset nocturne
```

This copies the preset over `src/content/theme.json` (it overwrites — it's a
demo/authoring convenience, not a merge). Restart `next dev` or rebuild to see it.
To get back to the default: `git checkout src/content/theme.json`.

## The catalog

| Preset | Mood | Default mode | Type pairing |
| --- | --- | --- | --- |
| **kiln** | Warm craft-editorial — matte, tactile, calm | light | Fraunces · Inter · IBM Plex Mono |
| **werkstatt** | Bauhaus primary — bold, red/blue/yellow, hard keylines | light | Archivo · Archivo · Space Mono |
| **nocturne** | Midnight botanical — warm dark, brass + sage | dark | Playfair Display · Inter · IBM Plex Mono |

`werkstatt` deliberately maps the engine's three semantic accents
(`accent` / `accentSecondary` / `accentTertiary`) to primary red / blue / yellow —
a demo that the tri-accent system is real structure, not decoration.

## Make your own

Copy any preset, edit the twelve colour tokens per mode and the three font
families, and drop it in `src/content/theme-presets/`. `npm run validate:content`
schema-checks every preset. Fonts default to `host: "google"` (a runtime
`<link>`); set `host: "self"` to self-host via `src/app/fonts.ts` instead — see
`docs/THEME-CUSTOMIZATION.md` § M2.
