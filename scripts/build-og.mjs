/**
 * Build-time OG image generator.
 *
 * Renders src/assets/images/default.png using the inline brand constants
 * below (kept in sync with src/components/CustomStyles.astro by hand —
 * there's no runtime token source this script can read). Runs via
 * `npm run build:og` (and the `prebuild` npm hook).
 *
 * Fonts are loaded from the `@fontsource/*` npm packages in devDependencies
 * (Space Grotesk 700, Inter Tight 500 — both latin WOFF). No network is
 * touched at build time. Satori accepts WOFF directly; WOFF2 is not
 * supported by Satori, which is why we resolve the `.woff` file rather
 * than `.woff2`.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = resolve(ROOT, 'src/assets/images/default.png');
const LOGO_SRC = resolve(ROOT, 'src/assets/favicons/apple-touch-icon.png');

const require = createRequire(import.meta.url);

// Brand tokens — keep in sync with src/components/CustomStyles.astro.
const BG = '#0A0F1F';
const PRIMARY = '#6C94FF';
const TEXT = '#F1F5FC';
const MUTED = 'rgba(226, 232, 243, 0.66)';

const FONTS = [
  {
    name: 'Space Grotesk',
    pkg: '@fontsource/space-grotesk',
    specifier: '@fontsource/space-grotesk/files/space-grotesk-latin-700-normal.woff',
    weight: 700,
  },
  {
    name: 'Inter Tight',
    pkg: '@fontsource/inter-tight',
    specifier: '@fontsource/inter-tight/files/inter-tight-latin-500-normal.woff',
    weight: 500,
  },
];

function resolveFontPath(font) {
  try {
    return require.resolve(font.specifier);
  } catch (err) {
    throw new Error(
      `Failed to resolve font file "${font.specifier}" for ${font.name}. ` +
        `Ensure "${font.pkg}" is installed as a devDependency (run "npm ci") ` +
        `and that the expected .woff filename has not changed in an upstream release. ` +
        `Underlying error: ${err.message}`
    );
  }
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
  const fontPaths = FONTS.map(resolveFontPath);
  const [fontData, logoDataUrl] = await Promise.all([
    Promise.all(fontPaths.map((path) => readFile(path))),
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
