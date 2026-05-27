import { GIFEncoder, quantize, applyPalette } from 'gifenc';

export type HoleStatus = 'success' | 'error' | 'warning';

export type ConnectivityHoleSpec = {
  id: string;
  name: string;
  stopDepth: number;
  maxDepth: number;
  status: HoleStatus;
};

const SCALE = 2;
const W = 360 * SCALE;
const H = 480 * SCALE;
const FPS = 20;
const FALL_DURATION_S = 2;
const TAIL_DURATION_S = 1.2;
const TOTAL_FRAMES = Math.round((FALL_DURATION_S + TAIL_DURATION_S) * FPS);
const FALL_FRAMES = Math.round(FALL_DURATION_S * FPS);
const FRAME_DELAY_MS = Math.round(1000 / FPS);

const STATUS_TEXT: Record<HoleStatus, string> = {
  success: '✓ 到底',
  error: '✖ 受阻',
  warning: '↓↓ 阻力偏大',
};

const STATUS_COLOR: Record<HoleStatus, string> = {
  success: '#16a34a',
  error: '#dc2626',
  warning: '#d97706',
};

const drawFrame = (
  ctx: CanvasRenderingContext2D,
  hole: ConnectivityHoleSpec,
  frameIdx: number,
) => {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#141414';
  ctx.font = `bold ${16 * SCALE}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('下放示意', W / 2, 36 * SCALE);

  const tubeX = W / 2 - 22 * SCALE;
  const tubeW = 44 * SCALE;
  const tubeY = 70 * SCALE;
  const tubeH = H - 130 * SCALE;

  ctx.strokeStyle = 'rgba(20,20,20,0.25)';
  ctx.lineWidth = 2 * SCALE;
  ctx.beginPath();
  ctx.moveTo(tubeX, tubeY);
  ctx.lineTo(tubeX, tubeY + tubeH);
  ctx.moveTo(tubeX + tubeW, tubeY);
  ctx.lineTo(tubeX + tubeW, tubeY + tubeH);
  ctx.stroke();

  ctx.fillStyle = '#141414';
  ctx.font = `${11 * SCALE}px monospace`;
  ctx.textAlign = 'left';
  [0, 5, 10, 15, 20].forEach(d => {
    const y = tubeY + (d / hole.maxDepth) * tubeH;
    ctx.strokeStyle = 'rgba(20,20,20,0.1)';
    ctx.lineWidth = 1 * SCALE;
    ctx.beginPath();
    ctx.moveTo(tubeX, y);
    ctx.lineTo(tubeX + tubeW, y);
    ctx.stroke();
    ctx.fillText(`${d}m`, tubeX + tubeW + 8 * SCALE, y + 4 * SCALE);
  });

  const t = Math.min(frameIdx / FALL_FRAMES, 1);
  const probeDepth = hole.stopDepth * t;
  const probeY = tubeY + (probeDepth / hole.maxDepth) * tubeH;

  ctx.strokeStyle = 'rgba(20,20,20,0.4)';
  ctx.lineWidth = 1 * SCALE;
  ctx.setLineDash([3 * SCALE, 3 * SCALE]);
  ctx.beginPath();
  ctx.moveTo(W / 2, tubeY);
  ctx.lineTo(W / 2, Math.max(tubeY, probeY - 22 * SCALE));
  ctx.stroke();
  ctx.setLineDash([]);

  const pW = 16 * SCALE;
  const pH = 26 * SCALE;
  const pX = W / 2 - pW / 2;
  const pY = probeY - 22 * SCALE;

  ctx.fillStyle = '#141414';
  ctx.beginPath();
  ctx.moveTo(pX, pY);
  ctx.lineTo(pX + pW, pY);
  ctx.lineTo(pX + pW, pY + pH - pW / 2);
  ctx.quadraticCurveTo(pX + pW, pY + pH, pX + pW / 2, pY + pH);
  ctx.quadraticCurveTo(pX, pY + pH, pX, pY + pH - pW / 2);
  ctx.closePath();
  ctx.fill();

  const pulse = 0.7 + 0.3 * Math.sin(frameIdx * 0.6);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(W / 2, pY + pH / 2 - 1 * SCALE, 3 * SCALE * pulse, 0, Math.PI * 2);
  ctx.fill();

  if (frameIdx >= FALL_FRAMES - 1) {
    ctx.fillStyle = STATUS_COLOR[hole.status];
    ctx.font = `bold ${14 * SCALE}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(STATUS_TEXT[hole.status], W / 2, probeY + 30 * SCALE);
  }
};

export const exportConnectivityGif = async (
  hole: ConnectivityHoleSpec,
): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  const gif = GIFEncoder();

  for (let i = 0; i < TOTAL_FRAMES; i++) {
    drawFrame(ctx, hole, i);
    const { data } = ctx.getImageData(0, 0, W, H);
    const palette = quantize(data, 256);
    const index = applyPalette(data, palette);
    gif.writeFrame(index, W, H, { palette, delay: FRAME_DELAY_MS });
  }

  gif.finish();
  return new Blob([gif.bytes()], { type: 'image/gif' });
};

export const DEFAULT_CONNECTIVITY_HOLES: ConnectivityHoleSpec[] = [
  { id: 'CX-01', name: 'CX-01', maxDepth: 20, stopDepth: 20, status: 'success' },
  { id: 'CX-02', name: 'CX-02', maxDepth: 20, stopDepth: 8, status: 'error' },
  { id: 'CX-03', name: 'CX-03', maxDepth: 20, stopDepth: 20, status: 'warning' },
  { id: 'CX-04', name: 'CX-04', maxDepth: 20, stopDepth: 16, status: 'error' },
];

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportAllConnectivityGifs = async (
  holes: ConnectivityHoleSpec[] = DEFAULT_CONNECTIVITY_HOLES,
) => {
  for (const hole of holes) {
    const blob = await exportConnectivityGif(hole);
    triggerDownload(blob, `connectivity-${hole.id}.gif`);
    await new Promise(resolve => setTimeout(resolve, 250));
  }
};
