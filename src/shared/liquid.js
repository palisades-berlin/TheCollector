// Shared Liquid Glass behavior layer.
// Keeps logic isolated from feature flows and only enhances visuals/interaction.
export function initLiquidUI({
  enableTilt = true,
  shrinkSelector = '[data-liquid-shrink]',
  tiltSelector = '[data-liquid-tilt]',
} = {}) {
  applyAdaptiveTint();
  setupScrollShrink(shrinkSelector);
  if (enableTilt) setupTiltParallax(tiltSelector);
}

function applyAdaptiveTint() {
  const root = document.documentElement;
  const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  // Extension pages cannot sample wallpaper pixels directly; this keeps tint adaptive
  // to user theme and allows future overrides through --liquid-tint-rgb.
  const fallback = dark ? '105, 140, 186' : '160, 203, 255';
  const declared = getComputedStyle(root).getPropertyValue('--liquid-tint-rgb').trim();
  root.style.setProperty('--liquid-tint-rgb', declared || fallback);
}

function setupScrollShrink(selector) {
  const targets = [...document.querySelectorAll(selector)];
  if (!targets.length) return;

  const onScroll = () => {
    const y = Math.max(0, window.scrollY || 0);
    const t = Math.min(1, y / 220);
    const scale = 1 - t * 0.3; // 1 -> 0.7
    const opacity = 1 - t * 0.12;

    for (const el of targets) {
      el.style.transition = 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 220ms ease';
      el.style.transform = `translateY(${t * -2}px) scale(${scale})`;
      el.style.opacity = `${opacity}`;
      el.style.transformOrigin = 'top center';
      el.style.willChange = 'transform, opacity';
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function setupTiltParallax(selector) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const targets = [...document.querySelectorAll(selector)];
  if (!targets.length) return;

  for (const el of targets) {
    el.style.willChange = 'transform';
  }

  const applyTilt = (pitch, roll) => {
    const x = clamp(roll / 28, -1, 1);
    const y = clamp(pitch / 28, -1, 1);
    for (const el of targets) {
      el.style.transform = `perspective(1000px) rotateX(${(-y * 2.6).toFixed(2)}deg) rotateY(${(x * 2.6).toFixed(2)}deg) translateZ(0)`;
    }
  };

  const resetTilt = () => {
    for (const el of targets) {
      el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)';
    }
  };

  if ('DeviceOrientationEvent' in window) {
    const onDevice = (event) => {
      if (event.beta == null || event.gamma == null) return;
      applyTilt(event.beta, event.gamma);
    };
    window.addEventListener('deviceorientation', onDevice, { passive: true });
  }

  // Desktop fallback: subtle pointer-based parallax.
  window.addEventListener(
    'pointermove',
    (event) => {
      const x = (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      const y = (event.clientY / Math.max(1, window.innerHeight)) * 2 - 1;
      applyTilt(y * 14, x * 14);
    },
    { passive: true }
  );

  window.addEventListener('pointerleave', resetTilt, { passive: true });
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}
