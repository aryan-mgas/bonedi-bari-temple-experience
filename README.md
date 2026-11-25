# Bonedi Bari Durga Pujo

A React + TypeScript site with an animated Three.js mandap journey and the original PBR family pandal model.

## Run locally

Requires Node.js 20.19 or newer.

```bash
npm install
npm run dev
```

## Personalise before publishing

Replace the bracketed fields in `src/App.tsx` with the family name, location, year, schedule, and contact details. The memory gallery is intentionally empty for the family's own photographs. Place the approved photographs in the gallery only after they are supplied.

The primary mandap uses the PBR export at `blender/source/base_basic_pbr.glb`; the companion shaded export is kept beside it. The rebuild script preserves the source geometry and PBR material maps without adding decorations or stairs. It exports the editable scene to `blender/bonedi_puja_mandap.blend` and the browser model to `src/assets/bonedi-puja-mandap.glb`. The Three.js camera follows the centerline through the original staircase entrance and passage. The memory board feature is parked for later work.
