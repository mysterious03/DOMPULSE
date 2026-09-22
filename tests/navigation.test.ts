import { describe, it, expect, vi } from 'vitest';
import { NavigationObserver } from '../src/core/navigation';

describe('DOMPulse SPA Navigation Observer', () => {
  it('detects history.pushState and emits NAVIGATION_DETECTED', () => {
    const onNavigate = vi.fn();
    const observer = new NavigationObserver(onNavigate);
    observer.start();

    const startUrl = window.location.href;
    history.pushState({ page: 2 }, '', '/checkout');

    expect(onNavigate).toHaveBeenCalled();
    const evt = onNavigate.mock.calls[0][0];
    expect(evt.type).toBe('NAVIGATION_DETECTED');
    expect(evt.before).toBe(startUrl);
    expect(evt.after).toContain('/checkout');
    expect(evt.importance).toBe(5);

    observer.stop();
  });

  it('detects history.replaceState and preserves original return value', () => {
    const onNavigate = vi.fn();
    const observer = new NavigationObserver(onNavigate);
    observer.start();

    history.replaceState({ page: 3 }, '', '/cart');

    expect(onNavigate).toHaveBeenCalled();
    const evt = onNavigate.mock.calls[0][0];
    expect(evt.type).toBe('NAVIGATION_DETECTED');
    expect(evt.after).toContain('/cart');

    observer.stop();
  });

  it('detects hashchange events', () => {
    const onNavigate = vi.fn();
    const observer = new NavigationObserver(onNavigate);
    observer.start();

    window.dispatchEvent(
      new HashChangeEvent('hashchange', {
        oldURL: 'http://localhost/cart',
        newURL: 'http://localhost/cart#payment',
      })
    );

    expect(onNavigate).toHaveBeenCalled();
    const evt = onNavigate.mock.calls[0][0];
    expect(evt.type).toBe('NAVIGATION_DETECTED');
    expect(evt.after).toContain('#payment');

    observer.stop();
  });
});
