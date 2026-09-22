import { describe, it, expect } from 'vitest';
import { DOMPulseEngine } from '../src/core/engine';

describe('DOMPulse Debounce & MaxWait Benchmark Matrix', () => {
  const configs = [
    { debounceMs: 30, maxWaitMs: 100 },
    { debounceMs: 50, maxWaitMs: 150 },
    { debounceMs: 80, maxWaitMs: 200 },
    { debounceMs: 100, maxWaitMs: 250 },
    { debounceMs: 150, maxWaitMs: 300 },
    { debounceMs: 200, maxWaitMs: 400 },
  ];

  it('evaluates noise reduction, latency, and recall across debounce windows', async () => {
    const results: any[] = [];

    for (const cfg of configs) {
      const root = document.createElement('div');
      document.body.appendChild(root);

      const btn = document.createElement('button');
      btn.id = 'btn';
      btn.textContent = 'Buy';
      root.appendChild(btn);

      const engine = new DOMPulseEngine(cfg);
      const batches: any[] = [];
      engine.onBatch((b) => batches.push(b));
      engine.start(root);

      const t0 = performance.now();

      // Fire burst: 1 meaningful text + 1 disabled + 1 toast + 60 noise
      btn.textContent = 'Processing...';
      btn.setAttribute('disabled', '');
      const toast = document.createElement('div');
      toast.setAttribute('role', 'alert');
      toast.textContent = 'Processing payment';
      root.appendChild(toast);

      for (let i = 0; i < 30; i++) {
        btn.className = i % 2 === 0 ? 'btn hover animate-pulse' : 'btn hover';
        btn.setAttribute(`data-v-test-${i}`, 'val');
      }

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

      results.push({
        debounceMs: cfg.debounceMs,
        maxWaitMs: cfg.maxWaitMs,
        raw: metrics.rawMutations,
        meaningful: metrics.meaningfulEvents,
        noiseReduction: (metrics.compressionRatio * 100).toFixed(1) + '%',
        latencyMs: (t1 - t0).toFixed(2),
        recall: recall.toFixed(1) + '%',
      });

      engine.stop();
      root.remove();
    }

    console.log('=== DEBOUNCE_BENCHMARK_MATRIX ===\n', JSON.stringify(results, null, 2));
    expect(results.length).toBe(6);
    expect(results.every((r) => r.recall === '100.0%')).toBe(true);
  });
});
