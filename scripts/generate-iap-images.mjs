import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { join } from 'path';

const OUT_DIR = join(import.meta.dirname, '..', 'public', 'iap-images');
await mkdir(OUT_DIR, { recursive: true });

const PRODUCTS = [
  {
    name: 'token_30',
    title: '30',
    subtitle: 'TOKEN',
    bgColor: '#FEF2F0',
    circleColor: '#E8553D',
    accentColor: '#D44A34',
    coinCount: 1,
  },
  {
    name: 'token_100',
    title: '100',
    subtitle: 'TOKEN',
    bgColor: '#FEF2F0',
    circleColor: '#E8553D',
    accentColor: '#B83D2A',
    coinCount: 2,
  },
  {
    name: 'token_300',
    title: '300',
    subtitle: 'TOKEN',
    bgColor: '#FEF2F0',
    circleColor: '#E8553D',
    accentColor: '#9A3222',
    coinCount: 3,
  },
  {
    name: 'premium_monthly',
    title: 'PRO',
    subtitle: 'MONTHLY',
    bgColor: '#F5ECD7',
    circleColor: '#D4A853',
    accentColor: '#B8923E',
    coinCount: 0,
    isPremium: true,
  },
  {
    name: 'premium_launch',
    title: 'VIP',
    subtitle: 'LIFETIME',
    bgColor: '#F5ECD7',
    circleColor: '#D4A853',
    accentColor: '#9C7B34',
    coinCount: 0,
    isPremium: true,
    isStar: true,
  },
];

function generateCoinsSvg(count) {
  if (count === 0) return '';
  const coins = [];
  const baseX = 512;
  const baseY = 580;
  const offsets = count === 1 ? [[0, 0]] : count === 2 ? [[-40, 10], [40, -10]] : [[-60, 15], [0, 0], [60, 15]];

  for (const [ox, oy] of offsets) {
    coins.push(`
      <circle cx="${baseX + ox}" cy="${baseY + oy}" r="55" fill="${'#D4A853'}" stroke="#B8923E" stroke-width="4"/>
      <circle cx="${baseX + ox}" cy="${baseY + oy}" r="40" fill="none" stroke="#B8923E" stroke-width="2" opacity="0.5"/>
      <text x="${baseX + ox}" y="${baseY + oy + 8}" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" font-weight="bold" fill="#7D5A1E">T</text>
    `);
  }
  return coins.join('');
}

function generatePremiumBadge(isStar) {
  const icon = isStar
    ? `<polygon points="512,520 530,570 585,570 540,600 555,650 512,625 469,650 484,600 439,570 494,570" fill="#D4A853" stroke="#B8923E" stroke-width="3"/>`
    : `<rect x="462" y="540" width="100" height="70" rx="12" fill="#D4A853" stroke="#B8923E" stroke-width="3"/>
       <text x="512" y="585" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" font-weight="bold" fill="#7D5A1E">PRO</text>`;
  return icon;
}

function generateSvg(product) {
  const { title, subtitle, bgColor, circleColor, accentColor, coinCount, isPremium, isStar } = product;

  return `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="1024" height="1024" rx="160" fill="${bgColor}"/>

  <!-- Decorative circles -->
  <circle cx="200" cy="200" r="120" fill="${circleColor}" opacity="0.08"/>
  <circle cx="824" cy="824" r="150" fill="${accentColor}" opacity="0.06"/>
  <circle cx="800" cy="250" r="80" fill="${circleColor}" opacity="0.05"/>

  <!-- Main circle -->
  <circle cx="512" cy="380" r="180" fill="${circleColor}" opacity="0.15"/>
  <circle cx="512" cy="380" r="140" fill="${circleColor}" opacity="0.25"/>
  <circle cx="512" cy="380" r="100" fill="${circleColor}"/>

  <!-- Title text in circle -->
  <text x="512" y="${title.length > 3 ? '390' : '395'}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${title.length > 3 ? '48' : '56'}" font-weight="bold" fill="white">${title}</text>

  <!-- Subtitle -->
  <text x="512" y="440" text-anchor="middle" font-family="Arial,sans-serif" font-size="20" font-weight="600" fill="white" opacity="0.8">${subtitle}</text>

  <!-- Bottom elements -->
  ${isPremium ? generatePremiumBadge(isStar) : generateCoinsSvg(coinCount)}

  <!-- App name -->
  <text x="512" y="750" text-anchor="middle" font-family="Arial,sans-serif" font-size="32" font-weight="bold" fill="${accentColor}">나랑 싸울래?</text>

  <!-- Bottom line -->
  <rect x="412" y="780" width="200" height="3" rx="1.5" fill="${accentColor}" opacity="0.3"/>
</svg>`;
}

for (const product of PRODUCTS) {
  const svg = generateSvg(product);
  const outPath = join(OUT_DIR, `${product.name}.png`);

  await sharp(Buffer.from(svg))
    .resize(1024, 1024)
    .png()
    .toFile(outPath);

  console.log(`Generated: ${outPath}`);
}

console.log('\nDone! Images are in public/iap-images/');
