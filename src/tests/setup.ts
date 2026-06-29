import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';

// Mock Web Animations API for Svelte transitions (jsdom doesn't implement it)
if (typeof Element.prototype.animate === 'undefined') {
  Element.prototype.animate = (() => ({
    cancel: () => {},
    play: () => {},
    pause: () => {},
    finish: () => {},
    addEventListener: () => {},
    removeEventListener: () => {}
  })) as unknown as typeof Element.prototype.animate;
}
