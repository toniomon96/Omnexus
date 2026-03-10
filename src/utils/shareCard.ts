/**
 * Canvas-based shareable card generator.
 * No external dependencies — uses the browser's 2D canvas API.
 * Output: 1080×1080 PNG blob (square, works for IG / Twitter / WhatsApp).
 */

const SIZE = 1080;

// ─── Brand tokens ─────────────────────────────────────────────────────────────

const BRAND = '#6366f1'; // brand-500
const AMBER = '#f59e0b'; // amber-400
const WHITE = '#ffffff';
const SLATE_400 = '#94a3b8';
const SLATE_600 = '#475569';
const KG_TO_LBS = 2.2046226218;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
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
  x: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  lines.push(current);

  lines.forEach((line, i) => {
    ctx.fillText(line, x, startY + i * lineHeight);
  });

  return lines.length * lineHeight;
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  // Base dark gradient
  const bg = ctx.createLinearGradient(0, 0, 0, SIZE);
  bg.addColorStop(0, '#0d0f1a');
  bg.addColorStop(0.5, '#1a1040');
  bg.addColorStop(1, '#0a0d1a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Top-left brand glow
  const g1 = ctx.createRadialGradient(0, 0, 0, 0, 0, SIZE * 0.65);
  g1.addColorStop(0, 'rgba(99,102,241,0.18)');
  g1.addColorStop(1, 'rgba(99,102,241,0)');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Bottom-right amber glow
  const g2 = ctx.createRadialGradient(SIZE, SIZE, 0, SIZE, SIZE, SIZE * 0.65);
  g2.addColorStop(0, 'rgba(245,158,11,0.12)');
  g2.addColorStop(1, 'rgba(245,158,11,0)');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Subtle dot grid noise
  ctx.fillStyle = 'rgba(255,255,255,0.025)';
  for (let gx = 40; gx < SIZE; gx += 60) {
    for (let gy = 40; gy < SIZE; gy += 60) {
      ctx.beginPath();
      ctx.arc(gx, gy, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawBrand(ctx: CanvasRenderingContext2D, y: number) {
  ctx.textAlign = 'center';
  ctx.font = `700 ${SIZE * 0.038}px -apple-system, system-ui, BlinkMacSystemFont, sans-serif`;
  ctx.fillStyle = BRAND;
  ctx.globalAlpha = 0.9;
  ctx.fillText('OMNEXUS', SIZE / 2, y);
  ctx.globalAlpha = 1;
}

function drawFooter(ctx: CanvasRenderingContext2D) {
  const y = SIZE * 0.92;

  // Divider line
  const lineGrad = ctx.createLinearGradient(SIZE * 0.15, 0, SIZE * 0.85, 0);
  lineGrad.addColorStop(0, 'rgba(99,102,241,0)');
  lineGrad.addColorStop(0.5, 'rgba(99,102,241,0.5)');
  lineGrad.addColorStop(1, 'rgba(99,102,241,0)');
  ctx.fillStyle = lineGrad;
  ctx.fillRect(SIZE * 0.15, y - 24, SIZE * 0.7, 1.5);

  // Tagline
  ctx.font = `400 ${SIZE * 0.026}px -apple-system, system-ui, BlinkMacSystemFont, sans-serif`;
  ctx.fillStyle = SLATE_600;
  ctx.textAlign = 'center';
  ctx.fillText('Train smarter. Lift heavier.', SIZE / 2, y);
}

// ─── PR Card ──────────────────────────────────────────────────────────────────

export interface PRCardData {
  exerciseName: string;
  weight: number;
  reps: number;
  weightUnit?: 'kg' | 'lbs';
  date?: string;
}

function drawPRCard(ctx: CanvasRenderingContext2D, data: PRCardData) {
  const cx = SIZE / 2;

  drawBackground(ctx);

  // Centre glow behind trophy
  const centreGlow = ctx.createRadialGradient(cx, SIZE * 0.42, 0, cx, SIZE * 0.42, SIZE * 0.28);
  centreGlow.addColorStop(0, 'rgba(245,158,11,0.15)');
  centreGlow.addColorStop(1, 'rgba(245,158,11,0)');
  ctx.fillStyle = centreGlow;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Card panel
  roundRect(ctx, SIZE * 0.07, SIZE * 0.09, SIZE * 0.86, SIZE * 0.8, 32);
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  drawBrand(ctx, SIZE * 0.19);

  // "PERSONAL RECORD" badge background
  const badgeW = SIZE * 0.56;
  const badgeH = SIZE * 0.065;
  const badgeX = cx - badgeW / 2;
  const badgeY = SIZE * 0.28 - badgeH / 2;
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2);
  ctx.fillStyle = 'rgba(245,158,11,0.15)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(245,158,11,0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = `700 ${SIZE * 0.033}px -apple-system, system-ui, BlinkMacSystemFont, sans-serif`;
  ctx.fillStyle = AMBER;
  ctx.textAlign = 'center';
  ctx.fillText('✦  PERSONAL RECORD  ✦', cx, SIZE * 0.295);

  // Trophy
  ctx.font = `${SIZE * 0.11}px serif`;
  ctx.fillText('🏆', cx, SIZE * 0.415);

  // Exercise name
  ctx.font = `700 ${SIZE * 0.068}px -apple-system, system-ui, BlinkMacSystemFont, sans-serif`;
  ctx.fillStyle = WHITE;
  wrapText(ctx, data.exerciseName.toUpperCase(), cx, SIZE * 0.525, SIZE * 0.74, SIZE * 0.082);

  // Weight × Reps (big number)
  ctx.font = `900 ${SIZE * 0.115}px -apple-system, system-ui, BlinkMacSystemFont, sans-serif`;
  const statText = `${data.weight} ${data.weightUnit ?? 'kg'} × ${data.reps}`;
  // Gradient text via clip trick
  const statGrad = ctx.createLinearGradient(cx - SIZE * 0.3, 0, cx + SIZE * 0.3, 0);
  statGrad.addColorStop(0, '#f59e0b');
  statGrad.addColorStop(1, '#fcd34d');
  ctx.fillStyle = statGrad;
  ctx.fillText(statText, cx, SIZE * 0.67);

  // Date
  if (data.date) {
    ctx.font = `400 ${SIZE * 0.03}px -apple-system, system-ui, BlinkMacSystemFont, sans-serif`;
    ctx.fillStyle = SLATE_400;
    ctx.globalAlpha = 0.7;
    ctx.fillText(data.date, cx, SIZE * 0.74);
    ctx.globalAlpha = 1;
  }

  drawFooter(ctx);
}

// ─── Weekly Card ──────────────────────────────────────────────────────────────

export interface WeeklyCardData {
  sessions: number;
  volumeKg: number;
  durationMinutes: number;
  streakDays: number;
  weightUnit?: 'kg' | 'lbs';
  userName?: string;
}

function drawWeeklyCard(ctx: CanvasRenderingContext2D, data: WeeklyCardData) {
  const cx = SIZE / 2;
  const displayUnit = data.weightUnit ?? 'kg';
  const displayVolume = displayUnit === 'lbs'
    ? data.volumeKg * KG_TO_LBS
    : data.volumeKg;

  drawBackground(ctx);

  // Card panel
  roundRect(ctx, SIZE * 0.07, SIZE * 0.09, SIZE * 0.86, SIZE * 0.8, 32);
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  drawBrand(ctx, SIZE * 0.19);

  // "THIS WEEK" badge
  const badgeW = SIZE * 0.42;
  const badgeH = SIZE * 0.065;
  const badgeX = cx - badgeW / 2;
  const badgeY = SIZE * 0.27 - badgeH / 2;
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2);
  ctx.fillStyle = 'rgba(99,102,241,0.18)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(99,102,241,0.45)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = `700 ${SIZE * 0.033}px -apple-system, system-ui, BlinkMacSystemFont, sans-serif`;
  ctx.fillStyle = BRAND;
  ctx.textAlign = 'center';
  ctx.fillText('THIS WEEK', cx, SIZE * 0.288);

  // Optional user name
  if (data.userName && data.userName !== 'You') {
    ctx.font = `600 ${SIZE * 0.055}px -apple-system, system-ui, BlinkMacSystemFont, sans-serif`;
    ctx.fillStyle = WHITE;
    ctx.fillText(data.userName, cx, SIZE * 0.40);
  }

  // Stat boxes
  const stats = [
    { label: 'SESSIONS', value: String(data.sessions), unit: '' },
    {
      label: 'VOLUME',
      value: String(Math.round(displayVolume)),
      unit: displayUnit,
    },
    { label: 'STREAK', value: String(data.streakDays), unit: 'days' },
  ];

  const boxW = SIZE * 0.23;
  const boxH = SIZE * 0.22;
  const boxGap = SIZE * 0.035;
  const totalW = stats.length * boxW + (stats.length - 1) * boxGap;
  const boxStartX = cx - totalW / 2;
  const boxY = SIZE * 0.46;

  stats.forEach((stat, i) => {
    const bx = boxStartX + i * (boxW + boxGap);

    // Box background
    roundRect(ctx, bx, boxY, boxW, boxH, 20);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Value
    ctx.font = `900 ${SIZE * 0.095}px -apple-system, system-ui, BlinkMacSystemFont, sans-serif`;
    ctx.fillStyle = WHITE;
    ctx.textAlign = 'center';
    ctx.fillText(stat.value, bx + boxW / 2, boxY + boxH * 0.58);

    // Unit (superscript-ish)
    if (stat.unit) {
      const valWidth = ctx.measureText(stat.value).width;
      ctx.font = `600 ${SIZE * 0.038}px -apple-system, system-ui, BlinkMacSystemFont, sans-serif`;
      ctx.fillStyle = SLATE_400;
      ctx.fillText(stat.unit, bx + boxW / 2 + valWidth * 0.45, boxY + boxH * 0.45);
    }

    // Label
    ctx.font = `600 ${SIZE * 0.028}px -apple-system, system-ui, BlinkMacSystemFont, sans-serif`;
    ctx.fillStyle = SLATE_600;
    ctx.fillText(stat.label, bx + boxW / 2, boxY + boxH * 0.88);
  });

  // Motivational line
  const phrases = [
    'Consistency is the key.',
    'Every rep counts.',
    'Progress, not perfection.',
    'Show up. Put in the work.',
    'Results take time. Keep going.',
  ];
  const phrase = phrases[Math.floor(data.sessions % phrases.length)];
  ctx.font = `400 italic ${SIZE * 0.036}px Georgia, serif`;
  ctx.fillStyle = SLATE_400;
  ctx.globalAlpha = 0.65;
  ctx.textAlign = 'center';
  ctx.fillText(`"${phrase}"`, cx, SIZE * 0.81);
  ctx.globalAlpha = 1;

  drawFooter(ctx);
}

// ─── Public API ───────────────────────────────────────────────────────────────

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
      'image/png',
    );
  });
}

function makeCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D not supported');
  return { canvas, ctx };
}

export async function generatePRCard(data: PRCardData): Promise<Blob> {
  const { canvas, ctx } = makeCanvas();
  drawPRCard(ctx, data);
  return canvasToBlob(canvas);
}

export async function generateWeeklyCard(data: WeeklyCardData): Promise<Blob> {
  const { canvas, ctx } = makeCanvas();
  drawWeeklyCard(ctx, data);
  return canvasToBlob(canvas);
}

/** Download the blob or use the native Web Share API (mobile). */
export async function shareOrDownload(blob: Blob, filename: string): Promise<void> {
  const file = new File([blob], filename, { type: 'image/png' });
  if (
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] })
  ) {
    await navigator.share({ files: [file], title: 'My Omnexus progress' });
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
