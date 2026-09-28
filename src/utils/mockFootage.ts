import { CameraPositionId, SportType } from '../types';

export const CAMERA_POSITIONS: Record<CameraPositionId, { label: string; shortLabel: string; description: string }> = {
  pos_fundo_cima: {
    label: 'Linha de Fundo Superior',
    shortLabel: 'Fundo Cima',
    description: 'Visão de ponta a ponta, ideal para conferir bola dentro/fora na linha de fundo oposta.',
  },
  pos_fundo_baixo: {
    label: 'Linha de Fundo Inferior',
    shortLabel: 'Fundo Baixo',
    description: 'Monitora a linha de saque e bolas espirradas na linha de fundo próxima.',
  },
  pos_rede_esq: {
    label: 'Rede - Antena Esquerda',
    shortLabel: 'Rede Esq',
    description: 'Foco no toque na rede, bloqueio e passagem de bola por fora da antena.',
  },
  pos_rede_dir: {
    label: 'Rede - Antena Direita',
    shortLabel: 'Rede Dir',
    description: 'Foco na invasão por cima/baixo da rede e toques sutis no bloqueio.',
  },
  pos_lateral: {
    label: 'Lateral / Arquibancada',
    shortLabel: 'Lateral',
    description: 'Visão ampla panorâmica da quadra para dinâmica geral do ponto e invasão central.',
  },
};

/**
 * Draws realistic simulated synchronized multi-angle volleyball action onto a canvas.
 * Time parameter `t` is in seconds (0 to 40).
 */
export function drawSimulatedAngleFootage(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  positionId: CameraPositionId,
  sport: SportType,
  t: number,
  isSlowMo: boolean = false
) {
  // Normalize loop inside a 4-second sequence repeated across the 40s buffer
  const cycle = (t % 4.0); // 0 to 4s
  const isSand = sport === 'beach_volleyball';

  // Base background
  ctx.save();
  ctx.fillStyle = '#0a0d14';
  ctx.fillRect(0, 0, width, height);

  if (positionId === 'pos_rede_esq' || positionId === 'pos_rede_dir') {
    drawNetCloseup(ctx, width, height, positionId, cycle, isSand);
  } else if (positionId === 'pos_fundo_baixo' || positionId === 'pos_fundo_cima') {
    drawBaselineView(ctx, width, height, positionId, cycle, isSand);
  } else {
    drawWideLateralView(ctx, width, height, cycle, isSand);
  }

  // Draw HUD overlay
  drawTacticalHud(ctx, width, height, positionId, t, isSlowMo);

  ctx.restore();
}

function drawTacticalHud(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  positionId: CameraPositionId,
  t: number,
  isSlowMo: boolean
) {
  const pad = 12;
  ctx.font = '10px "JetBrains Mono", monospace';

  // Angle badge
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(pad, pad, 130, 22);
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 1;
  ctx.strokeRect(pad, pad, 130, 22);

  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.arc(pad + 10, pad + 11, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.fillText(CAMERA_POSITIONS[positionId]?.shortLabel.toUpperCase() || 'CAM', pad + 20, pad + 15);

  // Timecode
  const minutes = Math.floor(t / 60);
  const seconds = Math.floor(t % 60);
  const millis = Math.floor((t % 1) * 1000);
  const timecode = `00:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(width - pad - 120, pad, 120, 22);
  ctx.fillStyle = '#38bdf8';
  ctx.fillText(`REPLAY: -${(40 - t).toFixed(1)}s`, width - pad - 112, pad + 15);

  // Bottom watermark & status
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, height - 20, width, 20);
  ctx.fillStyle = '#9ca3af';
  ctx.font = '9px "JetBrains Mono", monospace';
  ctx.fillText(`DEMONSTRAÇÃO • ${timecode}`, pad, height - 7);

  if (isSlowMo) {
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(width - 80, height - 19, 74, 18);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.fillText('SLOW-MO', width - 72, height - 7);
  }
}

function drawNetCloseup(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pos: CameraPositionId,
  cycle: number,
  isSand: boolean
) {
  // Background gym or outdoor beach sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  if (isSand) {
    skyGrad.addColorStop(0, '#38bdf8');
    skyGrad.addColorStop(0.7, '#bae6fd');
    skyGrad.addColorStop(1, '#fde047');
  } else {
    skyGrad.addColorStop(0, '#1e293b');
    skyGrad.addColorStop(1, '#0f172a');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // Net horizontal tape (white band)
  const netY = h * 0.45;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, netY, w, 22);
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, netY + 22, w, 2);

  // Black mesh below tape
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1;
  const meshSize = 14;
  for (let x = 0; x < w; x += meshSize) {
    ctx.beginPath();
    ctx.moveTo(x, netY + 24);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = netY + 24; y < h; y += meshSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Antenna pole (red and white stripes)
  const isLeft = pos === 'pos_rede_esq';
  const antennaX = isLeft ? w * 0.28 : w * 0.72;
  const stripeH = 16;
  const poleW = 8;
  for (let y = 10; y < h; y += stripeH) {
    const isRed = Math.floor(y / stripeH) % 2 === 0;
    ctx.fillStyle = isRed ? '#ef4444' : '#ffffff';
    ctx.fillRect(antennaX - poleW / 2, y, poleW, stripeH);
  }

  // Action: Ball spikes over net between 2.0s and 3.0s
  // Attacker hand vs Blocker hand
  const jumpProgress = Math.sin((cycle / 4.0) * Math.PI); // peak around 2.0s
  
  // Blocker hands reaching over
  const blockerY = netY - 20 - jumpProgress * 35;
  const blockerX = isLeft ? antennaX + 45 : antennaX - 45;

  ctx.fillStyle = '#f87171'; // Sleeve
  ctx.fillRect(blockerX - 10, blockerY + 40, 20, 60);

  // Arms and Hands
  ctx.strokeStyle = '#fcd34d'; // Skin tone
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(blockerX - 8, blockerY + 40);
  ctx.lineTo(blockerX - 4, blockerY);
  ctx.moveTo(blockerX + 8, blockerY + 40);
  ctx.lineTo(blockerX + 4, blockerY);
  ctx.stroke();

  // Spiking ball path
  let ballX = 0;
  let ballY = 0;
  if (cycle < 1.8) {
    // Ball being set
    ballX = isLeft ? w * 0.75 : w * 0.25;
    ballY = h * 0.7 - cycle * 80;
  } else if (cycle >= 1.8 && cycle <= 2.5) {
    // Attack swing towards net & block!
    const hitP = (cycle - 1.8) / 0.7;
    ballX = (isLeft ? w * 0.75 : w * 0.25) + (blockerX - (isLeft ? w * 0.75 : w * 0.25)) * hitP;
    ballY = h * 0.15 + hitP * 40;
  } else {
    // Deflected off block fingers out of bounds
    const postP = (cycle - 2.5) / 1.5;
    ballX = blockerX + (isLeft ? -postP * 90 : postP * 90);
    ballY = blockerY + postP * 120;
  }

  // Draw ball (Volleyball tricolor: yellow, blue, white)
  drawVolleyball(ctx, ballX, ballY, 18, cycle * 12);

  // Contact splash / touch point highlight between 2.2s and 2.4s
  if (cycle >= 2.2 && cycle <= 2.4) {
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(blockerX, blockerY, 26 + (cycle - 2.2) * 80, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(34, 197, 94, 0.4)';
    ctx.beginPath();
    ctx.arc(blockerX, blockerY, 16, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBaselineView(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pos: CameraPositionId,
  cycle: number,
  isSand: boolean
) {
  // Court floor
  ctx.fillStyle = isSand ? '#d97706' : '#9a3412';
  ctx.fillRect(0, h * 0.3, w, h * 0.7);

  // Perspective court lines
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  
  // Baseline right at the bottom
  const baselineY = h * 0.82;
  ctx.beginPath();
  ctx.moveTo(w * 0.08, baselineY);
  ctx.lineTo(w * 0.92, baselineY);
  ctx.stroke();

  // Sidelines in perspective
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(w * 0.08, baselineY);
  ctx.lineTo(w * 0.28, h * 0.35); // Left sideline going to net
  ctx.moveTo(w * 0.92, baselineY);
  ctx.lineTo(w * 0.72, h * 0.35); // Right sideline
  ctx.stroke();

  // Net in distance
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.26, h * 0.35);
  ctx.lineTo(w * 0.74, h * 0.35);
  ctx.stroke();

  // Ball dropping on the line!
  // At cycle ~ 2.8s the ball hits the baseline close to line
  let ballX = w * 0.88; // Near right corner
  let ballY = 0;
  let ballScale = 1;

  if (cycle < 2.0) {
    ballX = w * 0.55 + Math.sin(cycle) * 40;
    ballY = h * 0.15 + cycle * 40;
    ballScale = 0.6 + cycle * 0.2;
  } else if (cycle >= 2.0 && cycle <= 2.85) {
    const dropP = (cycle - 2.0) / 0.85;
    ballX = w * 0.65 + dropP * (w * 0.89 - w * 0.65);
    ballY = h * 0.25 + dropP * (baselineY - h * 0.25);
    ballScale = 0.8 + dropP * 0.5;
  } else {
    // Bounce off
    const bounceP = (cycle - 2.85) / 1.15;
    ballX = w * 0.89 + bounceP * 30;
    ballY = baselineY - Math.sin(bounceP * Math.PI) * 45;
    ballScale = 1.3 - bounceP * 0.2;
  }

  // Draw ball
  drawVolleyball(ctx, ballX, ballY, 14 * ballScale, cycle * 8);

  // Impact chalk explosion exactly on line contact (cycle 2.80 to 3.10)
  if (cycle >= 2.80 && cycle <= 3.15) {
    const chalkP = (cycle - 2.80) / 0.35;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.8 - chalkP * 0.8})`;
    ctx.beginPath();
    ctx.ellipse(w * 0.89, baselineY, 18 * chalkP, 6 * chalkP, 0, 0, Math.PI * 2);
    ctx.fill();

    // Line call label
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillText('LANCE ILUSTRATIVO', w * 0.45, baselineY + 28);
  }
}

function drawWideLateralView(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cycle: number,
  isSand: boolean
) {
  // Gym floor or beach
  ctx.fillStyle = isSand ? '#eab308' : '#c2410c';
  ctx.fillRect(0, h * 0.5, w, h * 0.5);

  // Background wall
  ctx.fillStyle = isSand ? '#0284c7' : '#1f2937';
  ctx.fillRect(0, 0, w, h * 0.5);

  // Net in center
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.32);
  ctx.lineTo(w * 0.5, h * 0.75);
  ctx.stroke();

  // Attack line (3m)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.32, h * 0.5);
  ctx.lineTo(w * 0.32, h);
  ctx.moveTo(w * 0.68, h * 0.5);
  ctx.lineTo(w * 0.68, h);
  ctx.stroke();

  // Flying ball arc
  const arcX = w * 0.15 + (cycle / 4.0) * (w * 0.7);
  const arcY = h * 0.7 - Math.sin((cycle / 4.0) * Math.PI) * (h * 0.55);

  drawVolleyball(ctx, arcX, arcY, 12, cycle * 10);
}

function drawVolleyball(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  rotation: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  // Ball shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.arc(2, 2, radius, 0, Math.PI * 2);
  ctx.fill();

  // White base
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  // Blue & Yellow curved panels
  ctx.fillStyle = '#1d4ed8'; // Royal blue
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 0.65);
  ctx.lineTo(0, 0);
  ctx.fill();

  ctx.fillStyle = '#eab308'; // Volleyball yellow
  ctx.beginPath();
  ctx.arc(0, 0, radius, Math.PI, Math.PI * 1.65);
  ctx.lineTo(0, 0);
  ctx.fill();

  // Outline
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}
