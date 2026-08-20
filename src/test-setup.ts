import '@testing-library/jest-dom/vitest';

// recharts mide su contenedor con ResizeObserver, que jsdom no implementa.
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = globalThis.ResizeObserver ?? (ResizeObserverMock as unknown as typeof ResizeObserver);
