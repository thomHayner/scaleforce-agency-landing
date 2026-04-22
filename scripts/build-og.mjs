/**
 * Build-time OG image generator.
 *
 * Renders src/assets/images/default.png from the brand tokens in
 * docs/brand/guidelines.md. Runs via `npm run build:og` (and `prebuild`).
 *
 * Fonts are fetched from Google Fonts once and cached under
 * scripts/.fonts-cache/ — that dir is gitignored. No runtime network in CI
 * after the first build on a fresh clone (CI cache picks it up via
 * node_modules-adjacent persistence).
 */
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const FONT_CACHE = resolve(__dirname, '.fonts-cache');
const OUT = resolve(ROOT, 'src/assets/images/default.png');

// Brand tokens — keep in sync with src/components/CustomStyles.astro.
const BG = '#0A0F1F';
const PRIMARY = '#6C94FF';
const TEXT = '#F1F5FC';
const MUTED = 'rgba(226, 232, 243, 0.66)';

const FONTS = [
  {
    name: 'Space Grotesk',
    file: 'space-grotesk-700.ttf',
    url: 'https://fonts.gstatic.com/s/spacegrotesk/v22/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-gOoraIAEj4PVksj.ttf',
    weight: 700,
  },
  {
    name: 'Inter Tight',
    file: 'inter-tight-500.ttf',
    url: 'https://fonts.gstatic.com/s/intertight/v9/NGSnv5HMAFg6IuGlBNMjxJEL2VmU3NS7Z2mjPQ-qXA.ttf',
    weight: 500,
  },
];

async function ensureFont({ file, url }) {
  const path = resolve(FONT_CACHE, file);
  try {
    await access(path);
  } catch {
    await mkdir(FONT_CACHE, { recursive: true });
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
    await writeFile(path, Buffer.from(await res.arrayBuffer()));
  }
  return readFile(path);
}

// The chip mark, lifted from src/assets/favicons/favicon.svg.
// Kept inline so the OG image has no external asset dependencies.
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="200" height="200">
  <g transform="translate(0,32) scale(0.1,-0.1)" fill="${PRIMARY}" stroke="none">
    <path d="M83 280 c-87 -52 -83 -198 6 -245 38 -19 104 -19 142 0 89 47 93 193 6 245 -42 26 -112 26 -154 0z m144 -20 c34 -20 59 -57 47 -68 -4 -4 -9 -1 -11 5 -7 20 -41 59 -46 53 -2 -3 -8 -15 -11 -27 -6 -19 -3 -23 13 -23 12 0 21 -4 21 -10 0 -5 9 -10 20 -10 16 0 20 -7 20 -36 0 -28 -8 -44 -34 -70 -29 -29 -41 -34 -80 -34 -53 0 -90 20 -112 61 -17 33 -17 39 -4 39 6 0 10 -7 10 -16 0 -14 3 -14 15 -4 8 7 15 21 15 31 0 11 7 19 16 19 14 0 14 2 0 15 -22 23 -43 18 -54 -12 -10 -26 -10 -26 -11 -5 -3 87 106 141 186 92z" />
    <path d="M142 248 c4 -28 45 -38 55 -13 7 19 -12 35 -40 35 -13 0 -18 -6 -15 -22z" />
    <path d="M96 245 c-22 -17 -17 -29 8 -19 9 3 16 12 16 20 0 17 0 17 -24 -1z" />
    <path d="M120 210 c0 -5 5 -10 10 -10 6 0 10 5 10 10 0 6 -4 10 -10 10 -5 0 -10 -4 -10 -10z" />
    <path d="M137 169 c-15 -17 -27 -32 -27 -33 0 -2 13 -1 30 2 23 3 30 0 30 -12 0 -19 11 -21 27 -5 7 7 8 18 3 28 -5 9 -11 24 -14 34 -8 24 -18 21 -49 -14z" />
    <path d="M205 179 c-10 -15 3 -25 16 -12 7 7 7 13 1 17 -6 3 -14 1 -17 -5z" />
    <path d="M233 153 c-17 -6 -16 -38 0 -52 11 -8 16 -5 25 15 20 42 12 53 -25 37z" />
    <path d="M93 113 c-22 -8 -14 -32 17 -48 35 -18 60 -19 95 -3 48 22 22 41 -33 24 -29 -9 -36 -7 -50 11 -10 11 -23 19 -29 16z" />
    <path d="M140 110 c0 -5 5 -10 10 -10 6 0 10 5 10 10 0 6 -4 10 -10 10 -5 0 -10 -4 -10 -10z" />
  </g>
</svg>`;
const LOGO_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(LOGO_SVG)}`;

function template() {
  return {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '80px 96px',
        background: `linear-gradient(135deg, ${BG} 0%, #0D1428 100%)`,
        color: TEXT,
      },
      children: [
        {
          type: 'div',
          props: {
            style: { display: 'flex', alignItems: 'center', gap: '28px' },
            children: [
              { type: 'img', props: { src: LOGO_DATA_URL, width: 120, height: 120 } },
              {
                type: 'div',
                props: {
                  style: {
                    fontFamily: 'Space Grotesk',
                    fontSize: 92,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    color: TEXT,
                  },
                  children: 'ScaleForce',
                },
              },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', gap: '24px' },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    fontFamily: 'Inter Tight',
                    fontSize: 44,
                    fontWeight: 500,
                    lineHeight: 1.2,
                    color: TEXT,
                  },
                  children: 'AI, automations, and operations for teams that need to move.',
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    fontFamily: 'Inter Tight',
                    fontSize: 28,
                    fontWeight: 500,
                    color: MUTED,
                  },
                  children: 'ScaleForce.agency',
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    width: '320px',
                    height: '6px',
                    background: PRIMARY,
                    borderRadius: '999px',
                  },
                },
              },
            ],
          },
        },
      ],
    },
  };
}

async function main() {
  const [spaceGrotesk, interTight] = await Promise.all(FONTS.map(ensureFont));

  const svg = await satori(template(), {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Space Grotesk', data: spaceGrotesk, weight: 700, style: 'normal' },
      { name: 'Inter Tight', data: interTight, weight: 500, style: 'normal' },
    ],
  });

  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  await writeFile(OUT, png);
  console.log(`wrote ${OUT} (${png.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
