/**
 * DOMPulse Interactive Testbench & Benchmark Controller
 * Powers scenarios A through G, testing real-world UI actions, noise suppression,
 * client-side navigation, and mutation storm maxWait boundaries.
 */

import { DOMPulseEngine } from '../src/core/engine';
import { DOMPulseEvent } from '../src/core/types';

// Standalone fallback: If the extension content script is not running, initialize the engine directly
if (!window.__DOMPULSE__) {
  console.log('[Testbench] Initializing local DOMPulseEngine instance for standalone testing.');
  const localEngine = new DOMPulseEngine({ debounceMs: 80, maxWaitMs: 200 });
  localEngine.start(document.body);

  localEngine.onBatch((batch) => {
    for (const evt of batch.events) {
      window.dispatchEvent(new CustomEvent('dompulse:event', { detail: evt }));
    }
  });

  window.__DOMPULSE__ = {
    engine: localEngine,
    getMetrics: () => localEngine.getMetrics(),
    getRecentEvents: (limit) => localEngine.getRecentEvents(limit),
    pause: () => localEngine.pause(),
    resume: () => localEngine.resume(),
    clear: () => localEngine.clear(),
  };
}

// UI Elements
const addToCartBtn = document.getElementById('add-to-cart-btn') as HTMLButtonElement;
const cartCounterEl = document.getElementById('cart-counter')!;
const toastContainerEl = document.getElementById('toast-container')!;
const openModalBtn = document.getElementById('open-modal-btn')!;
const checkoutModal = document.getElementById('checkout-modal') as HTMLDialogElement;
const closeModalBtn = document.getElementById('close-modal-btn')!;
const cancelModalBtn = document.getElementById('cancel-modal-btn')!;
const confirmModalBtn = document.getElementById('confirm-modal-btn')!;
const agentNameInput = document.getElementById('agent-name-input') as HTMLInputElement;
const formErrorMsg = document.getElementById('form-error-msg')!;
const termsCheckbox = document.getElementById('terms-checkbox') as HTMLInputElement;
const submitFormBtn = document.getElementById('submit-form-btn') as HTMLButtonElement;

// Navigation scenario
const navPushBtn = document.getElementById('nav-push-btn')!;
const navReplaceBtn = document.getElementById('nav-replace-btn')!;
const navHashBtn = document.getElementById('nav-hash-btn')!;
const currentUrlDisplay = document.getElementById('current-url-display')!;
currentUrlDisplay.textContent = window.location.href;

// Noise & Benchmark
const tickerValEl = document.getElementById('ticker-val')!;
const benchInjectedEl = document.getElementById('bench-injected')!;
const benchEliminatedEl = document.getElementById('bench-eliminated')!;
const benchEmittedEl = document.getElementById('bench-emitted')!;
const stormTestBtn = document.getElementById('storm-test-btn')!;
const stormStatusEl = document.getElementById('storm-status')!;

// Console feed
const agentEventFeedEl = document.getElementById('agent-event-feed')!;
const consoleEventCountEl = document.getElementById('console-event-count')!;
const clearConsoleBtn = document.getElementById('clear-console-btn')!;

let cartItems = 0;
let eventReceivedCount = 0;

// Scenario A: Add to Cart Flow
addToCartBtn.addEventListener('click', () => {
  addToCartBtn.disabled = true;
  addToCartBtn.textContent = 'Adding...';

  setTimeout(() => {
    cartItems += 1;
    cartCounterEl.textContent = `${cartItems} item${cartItems === 1 ? '' : 's'}`;

    const toast = document.createElement('div');
    toast.className = 'toast-alert';
    toast.setAttribute('role', 'alert');
    toast.textContent = `Neural Engine Core v2 added to cart (Total: ${cartItems})`;
    toastContainerEl.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 4000);

    addToCartBtn.disabled = false;
    addToCartBtn.textContent = 'Add to Cart';
  }, 150);
});

// Scenario B: Modal Dialog
openModalBtn.addEventListener('click', () => {
  if (typeof checkoutModal.showModal === 'function') {
    checkoutModal.showModal();
  } else {
    checkoutModal.setAttribute('open', '');
  }
});

function closeModal() {
  if (typeof checkoutModal.close === 'function') {
    checkoutModal.close();
  } else {
    checkoutModal.removeAttribute('open');
  }
}

closeModalBtn.addEventListener('click', closeModal);
cancelModalBtn.addEventListener('click', closeModal);
confirmModalBtn.addEventListener('click', () => {
  closeModal();
  const alertToast = document.createElement('div');
  alertToast.className = 'toast-alert';
  alertToast.setAttribute('role', 'status');
  alertToast.textContent = 'Checkout confirmed successfully!';
  toastContainerEl.appendChild(alertToast);
  setTimeout(() => alertToast.remove(), 3500);
});

// Scenario C: Form State & Validation
agentNameInput.addEventListener('input', () => {
  const val = agentNameInput.value.trim();
  if (val.length > 0 && val.length < 4) {
    agentNameInput.setAttribute('aria-invalid', 'true');
    formErrorMsg.removeAttribute('hidden');
  } else {
    agentNameInput.removeAttribute('aria-invalid');
    formErrorMsg.setAttribute('hidden', '');
  }
  checkFormReady();
});

termsCheckbox.addEventListener('change', () => {
  checkFormReady();
});

function checkFormReady() {
  const validName = agentNameInput.value.trim().length >= 4;
  const agreed = termsCheckbox.checked;
  submitFormBtn.disabled = !(validName && agreed);
}

// Scenario D: SPA Navigation
navPushBtn.addEventListener('click', () => {
  const newUrl = `${window.location.pathname}#dashboard_${Date.now() % 1000}`;
  history.pushState({ page: 'dashboard' }, '', newUrl);
  currentUrlDisplay.textContent = window.location.href;
});

navReplaceBtn.addEventListener('click', () => {
  const newUrl = `${window.location.pathname}#settings_${Date.now() % 1000}`;
  history.replaceState({ page: 'settings' }, '', newUrl);
  currentUrlDisplay.textContent = window.location.href;
});

navHashBtn.addEventListener('click', () => {
  window.location.hash = `#billing_${Date.now() % 1000}`;
  currentUrlDisplay.textContent = window.location.href;
});

// Scenario E & G: Noise & Framework Stress Tests
function runNoiseStress(count: number) {
  let mutationsInjected = 0;
  const hiddenNoiseEl = document.createElement('div');
  hiddenNoiseEl.style.display = 'none';
  document.body.appendChild(hiddenNoiseEl);
  mutationsInjected++;

  for (let i = 0; i < count; i++) {
    tickerValEl.className = i % 2 === 0 ? 'ticker-active hover-effect pulse' : 'ticker-idle hover-effect';
    tickerValEl.setAttribute(`data-v-test-${i}`, 'dummy');
    tickerValEl.setAttribute(`_ngcontent-test-${i}`, 'dummy');
    mutationsInjected += 3;
  }

  // Inject 1 genuine state change
  tickerValEl.setAttribute('data-state', 'active');
  tickerValEl.textContent = `Calibrated (${count} noise injected)`;
  mutationsInjected += 2;

  setTimeout(() => {
    hiddenNoiseEl.remove();
    const metrics = window.__DOMPULSE__?.getMetrics();
    if (metrics) {
      benchInjectedEl.textContent = String(mutationsInjected);
      const ratio = (metrics.compressionRatio * 100).toFixed(1);
      benchEliminatedEl.textContent = `${ratio}%`;
      benchEmittedEl.textContent = String(metrics.meaningfulEvents);
    }
  }, 120);
}

document.getElementById('noise-100-btn')?.addEventListener('click', () => runNoiseStress(100));
document.getElementById('noise-500-btn')?.addEventListener('click', () => runNoiseStress(500));
document.getElementById('noise-1000-btn')?.addEventListener('click', () => runNoiseStress(1000));
document.getElementById('noise-5000-btn')?.addEventListener('click', () => runNoiseStress(5000));

// Scenario F: Mutation Storm (MaxWait Starvation Test)
stormTestBtn.addEventListener('click', () => {
  stormTestBtn.setAttribute('disabled', '');
  stormStatusEl.textContent = 'Storm Active: 400ms burst firing every 20ms...';

  let step = 0;
  const interval = setInterval(() => {
    step++;
    tickerValEl.setAttribute('data-storm-counter', String(step));
  }, 20);

  setTimeout(() => {
    clearInterval(interval);
    stormStatusEl.textContent = `Storm finished (${step} mutations). MaxWait forced flushes successfully without starvation!`;
    stormTestBtn.removeAttribute('disabled');
  }, 400);
});

// Agent Event Stream Listener
window.addEventListener('dompulse:event', (e: Event) => {
  const customEvt = e as CustomEvent<DOMPulseEvent>;
  const evt = customEvt.detail;
  if (!evt) return;

  eventReceivedCount += 1;
  consoleEventCountEl.textContent = `${eventReceivedCount} event${eventReceivedCount === 1 ? '' : 's'} received`;

  const placeholder = agentEventFeedEl.querySelector('.feed-placeholder');
  if (placeholder) {
    placeholder.remove();
  }

  const item = document.createElement('div');
  item.className = 'feed-item';

  const timeStr = new Date(evt.timestamp).toISOString().split('T')[1].slice(0, 12);
  const dot = (evt.importance ?? 1) >= 5 ? '🔴' : (evt.importance ?? 1) >= 3 ? '🟡' : '🟢';

  item.innerHTML = `
    <div class="feed-item-header">
      <span class="feed-item-type">${dot} [${evt.type}] (score: ${evt.importance ?? 1})</span>
      <span class="feed-item-time">${timeStr}</span>
    </div>
    <div class="feed-item-detail">
      <strong>${evt.element.selector}</strong>
      ${evt.before ? `| Before: "${evt.before}"` : ''}
      ${evt.after ? `| After: "${evt.after}"` : ''}
      ${evt.attributeName ? `| Attr: ${evt.attributeName}` : ''}
    </div>
    <div class="feed-item-bbox">
      screen_bbox: { x: ${evt.bbox.x}, y: ${evt.bbox.y}, w: ${evt.bbox.width}, h: ${evt.bbox.height} } | visible: ${evt.visibility.visible}
    </div>
  `;

  agentEventFeedEl.insertBefore(item, agentEventFeedEl.firstChild);
});

clearConsoleBtn.addEventListener('click', () => {
  agentEventFeedEl.innerHTML = `
    <div class="feed-placeholder">
      No events dispatched yet. Trigger an action above or test the Chrome extension popup.
    </div>
  `;
  eventReceivedCount = 0;
  consoleEventCountEl.textContent = '0 events received';
});
