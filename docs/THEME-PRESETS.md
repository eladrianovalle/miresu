# Theme presets

Bundled, ready-to-apply themes that show how far the same command-center layout
reskins by editing content alone — no code. Each preset in
`src/content/theme-presets/` is a complete `theme.json`: both light and dark
palettes, a font pairing (served via Google Fonts), and a `skin` block that sets
the visual character (glow, corner radius, section-label treatment). Applying one
changes the whole look, so two forks can look like different studios off the same
engine.

## Apply one

```bash
npm run apply-preset <name>     # e.g. npm run apply-preset nocturne
```

This copies the preset over `src/content/theme.json` — it overwrites, it's not a
merge. Restart `next dev` or rebuild to see it. To get back to the default:
`git checkout src/content/theme.json`. Run with no name (or an unknown one) and it
prints the list of available presets.

## The catalog

| Preset | Mood | Default mode | Skin (glow · radius · labels) | Type pairing |
| --- | --- | --- | --- | --- |
| **kiln** | Warm craft-editorial — matte, tactile, calm | light | none · sm · impressed | Fraunces · Inter · IBM Plex Mono |
| **werkstatt** | Bauhaus primary — bold red/blue/yellow, hard keylines | light | none · 0 · block | Archivo · Archivo · Space Mono |
| **nocturne** | Midnight botanical — warm dark, brass + sage | dark | warm · sm · plain | Playfair Display · Inter · IBM Plex Mono |

What each skin expresses:

- **kiln** — matte (no glow), softly rounded corners, and labels pressed into the
  surface like type stamped into wet clay (`impressed`). Reads as a quiet print
  editorial, not a screen UI.
- **werkstatt** — hard edges (`radius: 0`) and filled accent-block labels, so
  structure itself is the decoration. It deliberately maps the engine's three
  semantic accents (`accent` / `accentSecondary` / `accentTertiary`) to primary
  red / blue / yellow — proof the tri-accent system is real structure, not trim.
- **nocturne** — a dark theme that is not cyberpunk: a faint warm accent glow
  (`warm`) reads as lamplight rather than a neon CRT, with plain labels letting
  the botanical palette carry the mood.

## Fonts & licensing

All three presets ship free, Google-hosted families (`fonts.host: "google"`), so
they work out of the box in this public engine. Kiln pairs Fraunces with Inter;
Werkstatt uses the Archivo family; Nocturne pairs Playfair Display with Inter.

If you fork a preset and want a commercial display face (e.g. Canela or Söhne for
a nocturne-style look), that's a **bring-your-own-font** change: switch
`fonts.host` to `"self"` and wire the face in `src/app/fonts.ts` — see
`docs/THEME-CUSTOMIZATION.md` § M2. Don't commit a licensed font family as a
default in the public engine.

## Make your own

Copy any preset, edit the twelve colour tokens per mode, the three font families,
and the `skin` knobs, then drop it in `src/content/theme-presets/`.
`npm run validate:content` schema-checks every preset (they must parse under the
same `ThemeSchema` as the live `theme.json`), so a malformed preset fails CI
before anyone applies it.
