import { describe, it, expect } from 'vitest';
import { DOMPulseEngine } from '../src/core/engine';

describe('DOMPulse Quantitative Baseline Benchmark', () => {
  it('benchmarks e-commerce and noise stress scenarios', async () => {
    const root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);

    const btn = document.createElement('button');
    btn.id = 'btn';
    btn.textContent = 'Click';
    root.appendChild(btn);

    const cart = document.createElement('div');
    cart.id = 'cart';
    cart.textContent = '0';
    root.appendChild(cart);

    const engine = new DOMPulseEngine({ debounceMs: 80, maxWaitMs: 200 });
    const batches: any[] = [];
    engine.onBatch((b) => batches.push(b));
    engine.start(root);

    const t0 = performance.now();

    // 1. Meaningful changes:
    btn.textContent = 'Adding...';
    btn.setAttribute('disabled', '');
    cart.textContent = '1';

    const toast = document.createElement('div');
    toast.setAttribute('role', 'alert');
    toast.textContent = 'Item added';
    root.appendChild(toast);

    // 2. 100 cosmetic mutations (50 class toggles, 50 framework attributes)
    for (let i = 0; i < 50; i++) {
      btn.className = i % 2 === 0 ? 'btn hover animate-pulse' : 'btn hover';
      btn.setAttribute(`data-v-test-${i}`, 'val');
    }

    // Allow MutationObserver microtask to trigger and buffer mutations
    await new Promise((r) => setTimeout(r, 10));

    engine.flush();
    const t1 = performance.now();

    const metrics = engine.getMetrics();
    const totalEvents = batches.flatMap((b) => b.events);

    const capturedToast = totalEvents.some((e) => e.type === 'NOTIFICATION_APPEARED');
    const capturedText = totalEvents.some((e) => e.type === 'TEXT_CHANGED');
    const capturedDisabled = totalEvents.some((e) => e.attributeName === 'disabled');

    const expectedSignals = 3;
    const detectedSignals = [capturedToast, capturedText, capturedDisabled].filter(Boolean).length;
    const recall = (detectedSignals / expectedSignals) * 100;

    const report = {
      raw: metrics.rawMutations,
      filtered: metrics.filteredMutations,
      deduped: metrics.deduplicatedMutations,
      meaningful: metrics.meaningfulEvents,
      noiseReduction: (metrics.compressionRatio * 100).toFixed(1) + '%',
      latencyMs: (t1 - t0).toFixed(2),
      recall: recall.toFixed(1) + '%',
    };

    console.log('=== HARDENED_BENCHMARK_REPORT ===\n', JSON.stringify(report, null, 2));

    expect(metrics.rawMutations).toBeGreaterThan(50);
    expect(recall).toBe(100);
    expect(metrics.compressionRatio).toBeGreaterThan(0.9);

    engine.stop();
  });
});
