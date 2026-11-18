'use client';

/**
 * Flood-fills contiguous near-white pixels starting from the outer border
 * so an anime sprite on a white background becomes cleanly transparent
 * without erasing enclosed white areas (eyes, socks, collar).
 */
export async function loadTransparentSprite(src: string): Promise<{
  image: HTMLImageElement;
  dataUrl: string;
}> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = 'anonymous';
    el.onload = () => resolve(el);
    el.onerror = (err) => reject(err);
    el.src = src;
  });

  // Skip processing if data URL already has transparency or small icon
  const maxDim = 512;
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return { image: img, dataUrl: src };
  }

  ctx.drawImage(img, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  // Check if corners are already transparent
  const topLeftAlpha = data[3];
  if (topLeftAlpha < 20) {
    return { image: img, dataUrl: src };
  }

  const isNearWhite = (idx: number) => {
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a = data[idx + 3];
    if (a < 20) return true;
    const minC = Math.min(r, g, b);
    const maxC = Math.max(r, g, b);
    // Bright and low saturation
    return minC > 228 && maxC - minC < 26;
  };

  // Only run edge flood-fill if at least 2 corners are white-ish
  const corners = [
    0,
    (w - 1) * 4,
    (h - 1) * w * 4,
    ((h - 1) * w + (w - 1)) * 4,
  ];
  const whiteCorners = corners.filter((c) => isNearWhite(c)).length;
  if (whiteCorners < 2) {
    return { image: img, dataUrl: src };
  }

  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;

  const enqueue = (x: number, y: number) => {
    const pos = y * w + x;
    if (visited[pos]) return;
    if (!isNearWhite(pos * 4)) return;
    visited[pos] = 1;
    queue[tail++] = pos;
  };

  for (let x = 0; x < w; x++) {
    enqueue(x, 0);
    enqueue(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    enqueue(0, y);
    enqueue(w - 1, y);
  }

  while (head < tail) {
    const pos = queue[head++];
    const pxIdx = pos * 4;
    data[pxIdx + 3] = 0;

    const x = pos % w;
    const y = (pos - x) / w;

    if (x > 0) enqueue(x - 1, y);
    if (x < w - 1) enqueue(x + 1, y);
    if (y > 0) enqueue(x, y - 1);
    if (y < h - 1) enqueue(x, y + 1);
  }

  // Soft 1px anti-alias feather on pixels bordering transparent background
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const pos = y * w + x;
      if (visited[pos]) continue;
      const hasClearedNeighbor =
        visited[pos - 1] ||
        visited[pos + 1] ||
        visited[pos - w] ||
        visited[pos + w];
      if (hasClearedNeighbor) {
        const idx = pos * 4;
        const lum = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        if (lum > 205) {
          data[idx + 3] = Math.round(data[idx + 3] * 0.45);
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  const dataUrl = canvas.toDataURL('image/png');

  const transparentImg = await new Promise<HTMLImageElement>((resolve) => {
    const out = new Image();
    out.onload = () => resolve(out);
    out.onerror = () => resolve(img);
    out.src = dataUrl;
  });

  return { image: transparentImg, dataUrl };
}

/**
 * Wraps Joudy's real portrait inside a crisp circular rose-gold princess medallion
 * topped with a sparkling golden crown so she renders cleanly in 2D Arcade & World Map.
 */
export async function loadPortraitAvatarSprite(src: string): Promise<{
  image: HTMLImageElement;
  dataUrl: string;
}> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = 'anonymous';
    el.onload = () => resolve(el);
    el.onerror = (err) => reject(err);
    el.src = src;
  });

  const W = 256;
  const H = 296;
  const cx = W / 2;
  const cy = 164;
  const r = 104;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { image: img, dataUrl: src };

  // Soft golden aura halo behind medallion
  const glow = ctx.createRadialGradient(cx, cy, r * 0.65, cx, cy, r + 24);
  glow.addColorStop(0, 'rgba(251, 191, 36, 0.45)');
  glow.addColorStop(0.65, 'rgba(244, 63, 94, 0.25)');
  glow.addColorStop(1, 'rgba(244, 63, 94, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 24, 0, Math.PI * 2);
  ctx.fill();

  // Clip circular portrait (focus slightly upper-center on face)
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r - 4, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  const scale = Math.max((r * 2) / img.width, (r * 2) / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, cx - dw / 2, cy - dh * 0.44, dw, dh);
  ctx.restore();

  // Rose-gold & crisp white circular frame border
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
  ctx.stroke();

  const ringGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  ringGrad.addColorStop(0, '#FBBF24');
  ringGrad.addColorStop(0.5, '#F43F5E');
  ringGrad.addColorStop(1, '#F59E0B');
  ctx.strokeStyle = ringGrad;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 1, 0, Math.PI * 2);
  ctx.stroke();

  // Sparkling Golden Princess Crown perched on top
  ctx.save();
  ctx.translate(cx, 50);
  ctx.fillStyle = '#FACC15';
  ctx.strokeStyle = '#B45309';
  ctx.lineWidth = 3.5;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-42, 16);
  ctx.lineTo(-48, -16);
  ctx.lineTo(-20, 2);
  ctx.lineTo(0, -26);
  ctx.lineTo(20, 2);
  ctx.lineTo(48, -16);
  ctx.lineTo(42, 16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Crown ruby & emerald gems
  ctx.fillStyle = '#E11D48';
  ctx.beginPath();
  ctx.arc(0, -2, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#10B981';
  ctx.beginPath();
  ctx.arc(-26, 4, 4.5, 0, Math.PI * 2);
  ctx.arc(26, 4, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const dataUrl = canvas.toDataURL('image/png');
  const outImg = await new Promise<HTMLImageElement>((resolve) => {
    const out = new Image();
    out.onload = () => resolve(out);
    out.onerror = () => resolve(img);
    out.src = dataUrl;
  });

  return { image: outImg, dataUrl };
}

