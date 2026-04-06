import anime from 'animejs';

export function pageEntrance(selector: string): void {
  anime({
    targets: selector,
    opacity: [0, 1],
    translateY: [18, 0],
    easing: 'easeOutExpo',
    duration: 650,
    delay: anime.stagger(90),
  });
}

export function bitScatter(selector: string): void {
  anime({
    targets: selector,
    translateX: () => anime.random(-100, 100),
    translateY: () => anime.random(-80, 80),
    scale: [{ value: 0, duration: 0 }, { value: 1.1 }, { value: 0 }],
    opacity: [{ value: 1, duration: 0 }, { value: 0, duration: 800 }],
    easing: 'easeOutCubic',
    duration: 900,
    delay: anime.stagger(20),
  });
}

export function typewriter(el: HTMLElement, text: string): void {
  el.textContent = '';
  const state = { chars: 0 };
  anime({
    targets: state,
    chars: text.length,
    round: 1,
    easing: 'linear',
    duration: Math.max(400, text.length * 24),
    update: () => {
      el.textContent = text.slice(0, state.chars);
    },
  });
}

export function drawRing(el: SVGCircleElement, score: number): void {
  const radius = Number(el.getAttribute('r') ?? '52');
  const circumference = 2 * Math.PI * radius;
  el.style.strokeDasharray = `${circumference}`;
  const target = circumference * (1 - score / 100);

  anime({
    targets: el,
    strokeDashoffset: [circumference, target],
    duration: 1200,
    easing: 'easeInOutQuart',
  });
}

export function tabSlide(
  entering: HTMLElement,
  leaving: HTMLElement | null,
  dir: 'left' | 'right',
): void {
  const from = dir === 'left' ? -18 : 18;
  anime({
    targets: entering,
    opacity: [0, 1],
    translateX: [from, 0],
    duration: 320,
    easing: 'easeOutCubic',
  });

  if (leaving) {
    anime({
      targets: leaving,
      opacity: [1, 0],
      translateX: [0, -from],
      duration: 260,
      easing: 'easeInCubic',
    });
  }
}
