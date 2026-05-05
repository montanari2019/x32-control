#!/usr/bin/env node
/**
 * Generates app icon PNGs for Android and iOS from the SVG logo.
 * Run with: node scripts/generate-icons.js
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// SVG source: waveform/equalizer icon
const BACKGROUND_COLOR = '#851fea';
const ICON_COLOR = '#ffffff';
const PADDING_RATIO = 0.2; // 20% padding on each side
const MARK_PATH = 'M3 11V13M6 8V16M9 10V14M12 7V17M15 4V20M18 9V15M21 11V13';

function buildAppIconSvg(size) {
  const padding = Math.round(size * PADDING_RATIO);
  const innerSize = size - padding * 2;
  const scale = innerSize / 24;
  const strokeWidth = 1.5 / scale;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(
    size * 0.22,
  )}" fill="${BACKGROUND_COLOR}"/>
  <g transform="translate(${padding},${padding}) scale(${scale})">
    <path d="${MARK_PATH}"
      stroke="${ICON_COLOR}"
      stroke-width="${strokeWidth}"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"/>
  </g>
</svg>`;
}

function buildLaunchLogoSvg(size) {
  // Transparent background; intended to be placed on a solid LaunchScreen background.
  const paddingRatio = 0.12;
  const padding = Math.round(size * paddingRatio);
  const innerSize = size - padding * 2;
  const scale = innerSize / 24;
  const strokeWidth = 1.5 / scale;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <g transform="translate(${padding},${padding}) scale(${scale})">
    <path d="${MARK_PATH}"
      stroke="${ICON_COLOR}"
      stroke-width="${strokeWidth}"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"/>
  </g>
</svg>`;
}

const androidSizes = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

// iOS sizes required by Xcode
const iosSizes = [
  // iPad notifications/settings (1x)
  { file: 'Icon-20.png', size: 20 },
  { file: 'Icon-29.png', size: 29 },
  { file: 'Icon-40.png', size: 40 },
  { file: 'Icon-60.png', size: 60 },
  { file: 'Icon-58.png', size: 58 },
  { file: 'Icon-87.png', size: 87 },
  { file: 'Icon-80.png', size: 80 },
  { file: 'Icon-120.png', size: 120 },
  // iPad app icons
  { file: 'Icon-76.png', size: 76 },
  { file: 'Icon-152.png', size: 152 },
  { file: 'Icon-167.png', size: 167 },
  { file: 'Icon-180.png', size: 180 },
  { file: 'Icon-1024.png', size: 1024 },
];

async function generateIcon(svgBuffer, destPath, size) {
  await sharp(svgBuffer).resize(size, size).png().toFile(destPath);
  console.log(`  ✓ ${destPath}`);
}

async function main() {
  const root = path.resolve(__dirname, '..');

  console.log('\n=== Generating Android icons ===');
  for (const { dir, size } of androidSizes) {
    const svg = Buffer.from(buildAppIconSvg(size));
    const resDir = path.join(root, 'android', 'app', 'src', 'main', 'res', dir);

    await generateIcon(svg, path.join(resDir, 'ic_launcher.png'), size);
    await generateIcon(svg, path.join(resDir, 'ic_launcher_round.png'), size);
  }

  console.log('\n=== Generating iOS icons ===');
  const iosDir = path.join(
    root,
    'ios',
    'X32NativeShell',
    'Images.xcassets',
    'AppIcon.appiconset',
  );

  for (const { file, size } of iosSizes) {
    const svg = Buffer.from(buildAppIconSvg(size));
    await generateIcon(svg, path.join(iosDir, file), size);
  }

  console.log('\n=== Generating iOS LaunchScreen logo ===');
  const launchLogoDir = path.join(
    root,
    'ios',
    'X32NativeShell',
    'Images.xcassets',
    'LaunchLogo.imageset',
  );
  fs.mkdirSync(launchLogoDir, { recursive: true });

  const launchLogoSizes = [
    { file: 'LaunchLogo.png', size: 120 },
    { file: 'LaunchLogo@2x.png', size: 240 },
    { file: 'LaunchLogo@3x.png', size: 360 },
  ];

  for (const { file, size } of launchLogoSizes) {
    const svg = Buffer.from(buildLaunchLogoSvg(size));
    await generateIcon(svg, path.join(launchLogoDir, file), size);
  }

  console.log('\nDone! Icons generated successfully.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
