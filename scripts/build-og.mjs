/**
 * Build-time OG image generator.
 *
 * Renders src/assets/images/default.png using the inline brand constants
 * below (kept in sync with src/components/CustomStyles.astro by hand —
 * there's no runtime token source this script can read). Runs via
 * `npm run build:og` (and the `prebuild` npm hook).
 *
 * Fonts are fetched from Google Fonts on cache miss and stored under
 * scripts/.fonts-cache/ (gitignored). Builds require network access when
 * that cache is absent — including CI and Vercel, since the workflow
 * doesn't currently cache scripts/.fonts-cache separately.
 *
 * Eliminating the build-time network fetch (load TTFs from an npm-shipped
 * package, or add explicit CI caching) is tracked as a follow-up.
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
const LOGO_SRC = resolve(ROOT, 'src/assets/favicons/apple-touch-icon.png');

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

async function loadLogoDataUrl() {
  const png = await readFile(LOGO_SRC);
  return `data:image/png;base64,${png.toString('base64')}`;
}

function template(logoDataUrl) {
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
              { type: 'img', props: { src: logoDataUrl, width: 120, height: 120 } },
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
  const [fontData, logoDataUrl] = await Promise.all([
    Promise.all(FONTS.map((font) => ensureFont(font))),
    loadLogoDataUrl(),
  ]);

  const svg = await satori(template(logoDataUrl), {
    width: 1200,
    height: 630,
    fonts: FONTS.map((font, index) => ({
      name: font.name,
      data: fontData[index],
      weight: font.weight,
      style: 'normal',
    })),
  });

  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  await writeFile(OUT, png);
  console.log(`wrote ${OUT} (${png.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
