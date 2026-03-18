/**
 * Canvas API를 사용한 판결 결과 이미지 생성
 * Toss WebView에서는 html-to-image 사용 불가 → Canvas 직접 드로잉
 */

import type { Fight } from '@/types/database';

interface VerdictImageData {
  fight: Fight;
  judgeName: string;
}

const WIDTH = 720;
const HEIGHT = 960;
const PADDING = 48;

// Warm 테마 기본 색상
const COLORS = {
  bg: '#FAFAF7',
  card: '#FFFFFF',
  primary: '#E8553D',
  accent: '#D4A853',
  textDark: '#191F28',
  textMid: '#4E5968',
  textLight: '#8B95A1',
  gaugeBg: '#E5E8EB',
  border: '#E5E8EB',
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const lines: string[] = [];
  const chars = [...text];
  let currentLine = '';

  for (const char of chars) {
    const testLine = currentLine + char;
    if (ctx.measureText(testLine).width > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = char;
      if (lines.length >= maxLines) {
        lines[lines.length - 1] += '...';
        return lines;
      }
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export function generateVerdictImage({ fight, judgeName }: VerdictImageData): string {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d')!;

  const myName = fight.user_name || '나';
  const theirName = fight.opponent_name || '상대';
  const myFault = fight.user_fault ?? 50;
  const theirFault = fight.opponent_fault ?? 50;

  // Background
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Card
  const cardX = PADDING;
  const cardY = PADDING;
  const cardW = WIDTH - PADDING * 2;
  const cardH = HEIGHT - PADDING * 2;

  ctx.fillStyle = COLORS.card;
  ctx.shadowColor = 'rgba(0,0,0,0.08)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 4;
  roundRect(ctx, cardX, cardY, cardW, cardH, 24);
  ctx.fill();
  ctx.shadowColor = 'transparent';

  let y = cardY + 48;

  // Title
  ctx.fillStyle = COLORS.textLight;
  ctx.font = '500 24px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('AI 판결 결과', WIDTH / 2, y);
  y += 48;

  // Judge name
  ctx.fillStyle = COLORS.textDark;
  ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(`${judgeName} 판사`, WIDTH / 2, y);
  y += 60;

  // Divider
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX + 32, y);
  ctx.lineTo(cardX + cardW - 32, y);
  ctx.stroke();
  y += 40;

  // Names + percentages
  const gaugeX = cardX + 40;
  const gaugeW = cardW - 80;

  ctx.textAlign = 'left';
  ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = COLORS.primary;
  ctx.fillText(`${myName} ${myFault}%`, gaugeX, y);

  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.accent;
  ctx.fillText(`${theirName} ${theirFault}%`, gaugeX + gaugeW, y);
  y += 24;

  // Gauge bar
  const gaugeH = 20;
  const gaugeR = gaugeH / 2;

  // Background
  roundRect(ctx, gaugeX, y, gaugeW, gaugeH, gaugeR);
  ctx.fillStyle = COLORS.gaugeBg;
  ctx.fill();

  // My fault (left)
  const myW = Math.max(gaugeH, (myFault / 100) * gaugeW);
  if (myFault > 0) {
    ctx.beginPath();
    ctx.moveTo(gaugeX + gaugeR, y);
    ctx.lineTo(gaugeX + myW, y);
    ctx.lineTo(gaugeX + myW, y + gaugeH);
    ctx.lineTo(gaugeX + gaugeR, y + gaugeH);
    ctx.quadraticCurveTo(gaugeX, y + gaugeH, gaugeX, y + gaugeH - gaugeR);
    ctx.lineTo(gaugeX, y + gaugeR);
    ctx.quadraticCurveTo(gaugeX, y, gaugeX + gaugeR, y);
    ctx.closePath();
    ctx.fillStyle = COLORS.primary;
    ctx.fill();
  }

  // Opponent fault (right)
  const theirW = Math.max(gaugeH, (theirFault / 100) * gaugeW);
  if (theirFault > 0) {
    const theirX = gaugeX + gaugeW - theirW;
    ctx.beginPath();
    ctx.moveTo(theirX, y);
    ctx.lineTo(gaugeX + gaugeW - gaugeR, y);
    ctx.quadraticCurveTo(gaugeX + gaugeW, y, gaugeX + gaugeW, y + gaugeR);
    ctx.lineTo(gaugeX + gaugeW, y + gaugeH - gaugeR);
    ctx.quadraticCurveTo(gaugeX + gaugeW, y + gaugeH, gaugeX + gaugeW - gaugeR, y + gaugeH);
    ctx.lineTo(theirX, y + gaugeH);
    ctx.closePath();
    ctx.fillStyle = COLORS.accent;
    ctx.fill();
  }
  y += gaugeH + 48;

  // Claims
  const claimW = (gaugeW - 16) / 2;
  const claimH = 160;

  // My claim
  roundRect(ctx, gaugeX, y, claimW, claimH, 16);
  ctx.fillStyle = `${COLORS.primary}15`;
  ctx.fill();

  ctx.textAlign = 'left';
  ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = COLORS.primary;
  ctx.fillText(`${myName} 주장`, gaugeX + 16, y + 28);

  ctx.font = '18px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = COLORS.textMid;
  const myClaimLines = wrapText(ctx, fight.user_claim, claimW - 32, 4);
  myClaimLines.forEach((line, i) => {
    ctx.fillText(line, gaugeX + 16, y + 56 + i * 24);
  });

  // Opponent claim
  const claimX2 = gaugeX + claimW + 16;
  roundRect(ctx, claimX2, y, claimW, claimH, 16);
  ctx.fillStyle = `${COLORS.accent}15`;
  ctx.fill();

  ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = COLORS.accent;
  ctx.fillText(`${theirName} 주장`, claimX2 + 16, y + 28);

  ctx.font = '18px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = COLORS.textMid;
  const theirClaimLines = wrapText(ctx, fight.opponent_claim, claimW - 32, 4);
  theirClaimLines.forEach((line, i) => {
    ctx.fillText(line, claimX2 + 16, y + 56 + i * 24);
  });
  y += claimH + 32;

  // Judge comment
  if (fight.comment) {
    roundRect(ctx, gaugeX, y, gaugeW, 80, 16);
    ctx.fillStyle = `${COLORS.primary}12`;
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.font = 'italic 22px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = COLORS.textDark;
    const commentLines = wrapText(ctx, `"${fight.comment}"`, gaugeW - 48, 2);
    commentLines.forEach((line, i) => {
      ctx.fillText(line, WIDTH / 2, y + 36 + i * 28);
    });
  }

  // Footer
  ctx.textAlign = 'center';
  ctx.font = '20px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = COLORS.textLight;
  ctx.fillText('나랑 싸울래? | AI 연애재판소', WIDTH / 2, cardY + cardH - 32);

  return canvas.toDataURL('image/png');
}

/**
 * 이미지를 디바이스에 저장
 * - 토스 WebView: saveBase64Data() 사용 (<a download> 불가)
 * - 일반 브라우저: <a download> fallback
 */
export async function saveVerdictImageToDevice(base64: string): Promise<void> {
  // base64 data URL에서 순수 base64 추출 (saveBase64Data용)
  const pureBase64 = base64.replace(/^data:image\/png;base64,/, '');

  // 토스 환경: saveBase64Data 사용
  try {
    const { saveBase64Data } = await import('@apps-in-toss/web-framework');
    await saveBase64Data({
      data: pureBase64,
      fileName: `verdict-${Date.now()}.png`,
      mimeType: 'image/png',
    });
    return;
  } catch {
    // SDK 없거나 실패 → fallback
  }

  // 브라우저 fallback: <a download>
  const link = document.createElement('a');
  link.href = base64;
  link.download = `verdict-${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
