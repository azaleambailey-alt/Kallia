import { ActiveAlert } from '../types.ts';

export type WaterShapeMode = 'pure_circle' | 'fluid_amoeba' | 'oval_pond' | 'droplet_tear' | 'liquid_blob';
export type WaterMotionMode = 'zen_pool' | 'slow_swell' | 'calm_shimmer';

export interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  strength: number;
  speed: number;
  bornAt: number;
}

export interface WaterOptions {
  radiusScale?: number;        // 0.20 to 0.50
  waveSpeed?: number;          // 0.05 (whisper slow) to 4.0 (fast torrent)
  motionMode?: WaterMotionMode;
  shapeMode?: WaterShapeMode;  // pure_circle, fluid_amoeba, oval_pond, droplet_tear, liquid_blob
  morphIntensity?: number;     // 0 to 1 (how much the shape morphs and flexes)
  enableKineticDrift?: boolean; // gentle slow float on wall
  driftAmount?: number;        // 0 to 1
  waveIntensity?: number;      // 0.2 to 2.0
  naturalColor?: string;       // Default natural idle color (e.g. pristine white, soft pink, ocean blue)
}

/**
 * Pure Fluid Dynamic-Shape Water Simulation
 * - Supports custom natural state color (e.g. Pink, Soft Cyan, Warm Amber, Pure White)
 * - Transitions fluidly when IoT triggers fire (e.g. Baby Awake, Doorbell, Baby Crying)
 * - Zero horizontal lines: only pure radial gradients, soft orbiting caustic light pools, and concentric ripples
 * - Pure pitch black (#000000) outside the water shape
 */
export class WaterRenderer {
  private ripples: Ripple[] = [];
  private lastAutoDrop = 0;

  public addRipple(x: number, y: number, strength = 0.8, maxRadius = 380) {
    this.ripples.push({
      x,
      y,
      radius: 0,
      maxRadius,
      strength,
      speed: 1.2,
      bornAt: Date.now(),
    });

    if (this.ripples.length > 5) {
      this.ripples.shift();
    }
  }

  public render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    activeAlert: ActiveAlert | null,
    options: WaterOptions = {}
  ) {
    const baseSpeed = options.waveSpeed ?? 0.45;
    const waveSpeed = baseSpeed * (activeAlert ? activeAlert.speed : 1.0);
    const waveIntensity = options.waveIntensity ?? 0.8;
    const shapeMode = options.shapeMode ?? 'fluid_amoeba';
    const morphIntensity = options.morphIntensity ?? 0.65;
    const enableDrift = options.enableKineticDrift ?? true;
    const driftAmt = (options.driftAmount ?? 0.25) * 0.4;
    const naturalColor = options.naturalColor || '#F8FAFC'; // Default white

    // Slow, serene kinetic drift
    let cx = width / 2;
    let cy = height / 2;

    // Provide slight vertical centering compensation for shapes that naturally extend upward like teardrop
    if (shapeMode === 'droplet_tear') {
      cy += height * 0.02;
    }

    if (enableDrift) {
      const slowDriftTime = time * 0.18 * waveSpeed;
      const driftX = Math.sin(slowDriftTime) * (width * 0.03 * driftAmt);
      const driftY = Math.cos(slowDriftTime * 0.8) * (height * 0.025 * driftAmt);
      cx += driftX;
      cy += driftY;
    }

    const maxDim = Math.min(width, height);
    const baseRadius = maxDim * (options.radiusScale ?? 0.42);

    // Subtle rhythmic breathing
    const breathFactor = 1 + Math.sin(time * 0.4 * waveSpeed) * 0.02 * waveIntensity;
    const circleRadius = baseRadius * breathFactor;

    // Ambient water drops based on velocity
    const now = Date.now();
    const dropFreq = Math.max(800, 3600 / Math.max(0.2, waveSpeed));
    if (now - this.lastAutoDrop > dropFreq) {
      this.lastAutoDrop = now;
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * (circleRadius * 0.35);
      this.addRipple(
        cx + Math.cos(angle) * dist,
        cy + Math.sin(angle) * dist,
        0.6,
        circleRadius * 0.85
      );
    }

    // 1. PURE BLACK OUTSIDE THE WATER POOL (0 light on the wall)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // 2. DYNAMIC SHAPE CONTOUR COMPUTATION
    ctx.save();
    ctx.beginPath();

    const segments = 90;
    const perimeterPoints: { x: number; y: number }[] = [];

    for (let i = 0; i <= segments; i++) {
      const theta = (i * Math.PI * 2) / segments;
      let r = circleRadius;

      if (shapeMode === 'pure_circle') {
        r = circleRadius;
      } else if (shapeMode === 'fluid_amoeba') {
        const morph1 = Math.sin(theta * 3 + time * 0.7 * waveSpeed) * (circleRadius * 0.08 * morphIntensity);
        const morph2 = Math.cos(theta * 5 - time * 0.5 * waveSpeed) * (circleRadius * 0.05 * morphIntensity);
        const morph3 = Math.sin(theta * 2 + time * 0.3 * waveSpeed) * (circleRadius * 0.06 * morphIntensity);
        r = circleRadius + morph1 + morph2 + morph3;
      } else if (shapeMode === 'oval_pond') {
        const ovalFactor = 1 + Math.cos(theta * 2) * 0.22;
        const flex = Math.sin(theta * 4 + time * 0.8 * waveSpeed) * (circleRadius * 0.03 * morphIntensity);
        r = circleRadius * ovalFactor + flex;
      } else if (shapeMode === 'droplet_tear') {
        // Safe scaling & vertical offset so teardrop fits comfortably with zero top clipping
        const teardrop = (1 - Math.sin(theta) * 0.22 * (1 + Math.cos(theta) * 0.35)) * 0.82;
        const flex = Math.sin(theta * 3 + time * 0.6 * waveSpeed) * (circleRadius * 0.03 * morphIntensity);
        r = circleRadius * teardrop + flex;
      } else if (shapeMode === 'liquid_blob') {
        const lobe1 = Math.sin(theta * 4 + time * 0.8 * waveSpeed) * (circleRadius * 0.12 * morphIntensity);
        const lobe2 = Math.cos(theta * 6 - time * 0.6 * waveSpeed) * (circleRadius * 0.07 * morphIntensity);
        r = circleRadius + lobe1 + lobe2;
      }

      const px = cx + Math.cos(theta) * r;
      const py = cy + Math.sin(theta) * r;
      perimeterPoints.push({ x: px, y: py });

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }

    ctx.closePath();
    ctx.clip();

    // 3. COLOR PALETTES
    const isAlert = !!activeAlert;
    
    // Convert hex or named naturalColor to dynamic tones
    let baseDepthColor = 'rgba(235, 244, 255, 0.98)';
    let midToneColor = '#FFFFFF';
    let softShadowColor = 'rgba(195, 218, 242, 0.45)';
    let causticGlowColor = 'rgba(255, 255, 255, 0.28)';
    let rimGlowColor = 'rgba(255, 255, 255, 0.95)';

    // Compute natural state styling based on user-chosen natural color
    if (!isAlert) {
      if (naturalColor.toLowerCase().includes('pink') || naturalColor === '#F472B6' || naturalColor === '#EC4899') {
        baseDepthColor = 'rgba(244, 114, 182, 0.95)';
        midToneColor = '#FFF1F2';
        softShadowColor = 'rgba(157, 23, 77, 0.45)';
        causticGlowColor = 'rgba(251, 207, 232, 0.35)';
        rimGlowColor = 'rgba(255, 228, 230, 0.95)';
      } else if (naturalColor === '#38BDF8' || naturalColor.toLowerCase().includes('blue')) {
        baseDepthColor = 'rgba(56, 189, 248, 0.95)';
        midToneColor = '#F0F9FF';
        softShadowColor = 'rgba(12, 74, 110, 0.5)';
        causticGlowColor = 'rgba(186, 230, 253, 0.35)';
        rimGlowColor = 'rgba(224, 242, 254, 0.95)';
      } else if (naturalColor === '#A78BFA' || naturalColor.toLowerCase().includes('purple')) {
        baseDepthColor = 'rgba(167, 139, 250, 0.95)';
        midToneColor = '#FAF5FF';
        softShadowColor = 'rgba(76, 29, 149, 0.5)';
        causticGlowColor = 'rgba(233, 213, 255, 0.35)';
        rimGlowColor = 'rgba(243, 232, 255, 0.95)';
      } else if (naturalColor === '#34D399' || naturalColor.toLowerCase().includes('green')) {
        baseDepthColor = 'rgba(52, 211, 153, 0.95)';
        midToneColor = '#F0FDF4';
        softShadowColor = 'rgba(6, 78, 59, 0.5)';
        causticGlowColor = 'rgba(167, 243, 208, 0.35)';
        rimGlowColor = 'rgba(209, 250, 229, 0.95)';
      } else if (naturalColor === '#FBBF24' || naturalColor.toLowerCase().includes('amber')) {
        baseDepthColor = 'rgba(251, 191, 36, 0.95)';
        midToneColor = '#FFFBEB';
        softShadowColor = 'rgba(120, 53, 15, 0.5)';
        causticGlowColor = 'rgba(253, 230, 138, 0.35)';
        rimGlowColor = 'rgba(254, 243, 199, 0.95)';
      } else if (naturalColor !== '#F8FAFC' && naturalColor !== '#FFFFFF') {
        // Any custom user hex color
        baseDepthColor = naturalColor;
        midToneColor = '#FFFFFF';
        softShadowColor = 'rgba(0, 0, 0, 0.35)';
        causticGlowColor = 'rgba(255, 255, 255, 0.3)';
        rimGlowColor = '#FFFFFF';
      }
    } else {
      // Active alert trigger overrides color
      baseDepthColor = activeAlert.primaryColor || '#EF4444';
      midToneColor = activeAlert.secondaryColor || '#FFFFFF';
      softShadowColor = 'rgba(0, 0, 0, 0.55)';
      causticGlowColor = 'rgba(255, 255, 255, 0.35)';
      rimGlowColor = '#FFFFFF';
    }

    // 4. SMOOTH DEEP RADIAL WATER GRADIENT (Primary body of water)
    const lightAngle = time * 0.25 * waveSpeed;
    const focalX = cx + Math.cos(lightAngle) * (circleRadius * 0.2);
    const focalY = cy + Math.sin(lightAngle) * (circleRadius * 0.2);

    const depthGrad = ctx.createRadialGradient(
      focalX,
      focalY,
      circleRadius * 0.08,
      cx,
      cy,
      circleRadius * 1.15
    );
    depthGrad.addColorStop(0, midToneColor);
    depthGrad.addColorStop(0.55, baseDepthColor);
    depthGrad.addColorStop(0.85, softShadowColor);
    depthGrad.addColorStop(1, isAlert ? softShadowColor : 'rgba(180, 208, 238, 0.4)');

    ctx.fillStyle = depthGrad;
    ctx.fillRect(cx - circleRadius * 1.4, cy - circleRadius * 1.4, circleRadius * 2.8, circleRadius * 2.8);

    // 5. MOVING RADIAL LIQUID CAUSTIC POOLS (NO HORIZONTAL LINES)
    ctx.save();
    for (let c = 0; c < 3; c++) {
      const angle = time * 0.35 * waveSpeed + (c * Math.PI * 2) / 3;
      const dist = circleRadius * 0.36 * (0.8 + Math.sin(time * 0.5 * waveSpeed + c) * 0.25);
      const spotX = cx + Math.cos(angle) * dist;
      const spotY = cy + Math.sin(angle) * dist;
      const spotRadius = circleRadius * (0.35 + Math.cos(time * 0.4 * waveSpeed + c) * 0.1);

      const spotGrad = ctx.createRadialGradient(spotX, spotY, 0, spotX, spotY, spotRadius);
      spotGrad.addColorStop(0, causticGlowColor);
      spotGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = spotGrad;
      ctx.beginPath();
      ctx.arc(spotX, spotY, spotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 6. GENTLE EXPANDING WATER DROPLET RIPPLES (Only concentric rings)
    this.ripples.forEach((ripple) => {
      ripple.radius += ripple.speed * Math.max(0.3, waveSpeed);
      const progress = ripple.radius / ripple.maxRadius;
      if (progress >= 1) return;

      const alpha = Math.sin((1 - progress) * Math.PI) * ripple.strength * 0.65;

      ctx.lineWidth = 2.2;
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
      ctx.stroke();
    });

    this.ripples = this.ripples.filter((r) => r.radius < r.maxRadius);

    // 7. SHOCKWAVE PULSE FOR RING DOORBELL OR ALERTS
    if (activeAlert) {
      const pulseTime = time * 1.2 * waveSpeed;
      const pulseWaveR = (pulseTime * 85) % circleRadius;

      ctx.lineWidth = 4.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(cx, cy, pulseWaveR, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 8. LUMINOUS SURFACE TENSION RIM (Conforms to the dynamic morphed perimeter)
    ctx.save();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = rimGlowColor;
    ctx.beginPath();
    perimeterPoints.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.closePath();
    ctx.stroke();

    // Outer soft gradient transition
    ctx.lineWidth = 2;
    ctx.strokeStyle = isAlert
      ? 'rgba(255, 180, 180, 0.45)'
      : 'rgba(220, 238, 255, 0.55)';
    ctx.beginPath();
    perimeterPoints.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    ctx.restore(); // End clip
  }
}
