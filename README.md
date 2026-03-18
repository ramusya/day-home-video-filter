# day-home-video-filter

Mobile-first React + TypeScript + Vite app for iPhone Safari.

The app lets a user:
- select a photo
- apply a 1998–2005 daytime home video camcorder look
- adjust the effect with sliders
- toggle a timestamp overlay
- export a 1600x1200 JPEG

## Visual target

This project is tuned for a **normal family daytime camcorder** feel.
It is **not** a glitch VHS effect and does not add fake tape damage.

## Included effects

- slight highlight blowout and soft glow
- slight color aging / mild warmth and lower saturation
- mild softness / less digital sharpness
- light noise in darker parts of the frame
- optional timestamp in the bottom corner
- 4:3 crop output

## Tech stack

- React 18
- TypeScript
- Vite 5

## Project structure

```text
.
├── index.html
├── package.json
├── README.md
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── public/
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── styles.css
    ├── types.ts
    ├── vite-env.d.ts
    ├── components/
    │   ├── ControlsPanel.tsx
    │   ├── FilePicker.tsx
    │   └── PreviewCanvas.tsx
    └── lib/
        ├── imageProcessing.ts
        ├── presets.ts
        └── timestamp.ts
```

## How it works

`src/lib/imageProcessing.ts` contains the main filter pipeline:

1. crop the image to a centered 4:3 frame
2. soften the image by drawing through a slightly smaller buffer
3. shift highlights and colors toward a mild older-camcorder look
4. add subtle dark-area noise
5. add a small bloom pass on bright areas
6. draw the optional timestamp

The preview renders at 800x600 for smoother slider updates.
Export renders again at the final 1600x1200 size.

## Run locally

```bash
npm install
npm run dev
```

Then open the local Vite URL in the browser.
For mobile Safari testing on the same network, run Vite with the shown network URL.

## Build

```bash
npm run build
```

The production files will be created in:

```text
dist/
```

## Preview the production build

```bash
npm run preview
```

## Notes for future work

Potential next improvements:
- manual crop positioning
- EXIF date readout for timestamp text
- save/share flow tuned for iPhone Safari
- side-by-side original/processed comparison
- reusable preset import/export
