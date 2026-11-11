import 'vitest-canvas-mock';

// jsdom/happy-dom don't implement ResizeObserver, but the primitive <uplot> wrapper constructs
// one on every chart. Without this, that constructor throws inside afterNextRender, silently
// breaking created/deleted output emission and leaking render-hook errors into later tests.
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  } as unknown as typeof ResizeObserver;
}

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList;
}
