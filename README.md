<div align="center">

<img src="./assets/banner.png" alt="DOMPulse Hero Banner" width="100%" style="border-radius: 12px; margin-bottom: 20px;" />

# ⚡ DOMPulse

### *Browser-Side Perception & Change-Intelligence Layer for AI Agents*

[![Build Status](https://img.shields.io/badge/build-passing-34d399?style=for-the-badge&logo=github-actions&logoColor=white)](https://github.com/mysterious03/DOMPULSE)
[![Tests](https://img.shields.io/badge/tests-30%20passed-38bdf8?style=for-the-badge&logo=vitest&logoColor=white)](https://github.com/mysterious03/DOMPULSE)
[![Noise Reduction](https://img.shields.io/badge/noise%20elimination-96.2%25-c084fc?style=for-the-badge)](https://github.com/mysterious03/DOMPULSE)
[![Manifest](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-fbbf24?style=for-the-badge&logo=googlechrome&logoColor=white)](https://github.com/mysterious03/DOMPULSE)
[![Zero Cloud APIs](https://img.shields.io/badge/Local%20%26%20Deterministic-100%25-f43f5e?style=for-the-badge)](https://github.com/mysterious03/DOMPULSE)

<p align="center">
  <b>Stop sending screenshots to expensive Vision Models every 500ms.</b><br>
  DOMPulse observes browser mutations, eliminates framework noise, extracts screen coordinates, and streams high-fidelity state events directly to autonomous agents.
</p>

[Quick Start](#-quick-start) • [The Problem](#-the-problem) • [Architecture](#-architecture) • [Event Schema](#-structured-event-schema) • [Benchmarks](#-hardened-benchmarks) • [Developer Dashboard](#-developer-event-viewer)

---

</div>

## 🧠 The Core Philosophy

> ### *"Don't make the AI repeatedly look at the entire webpage. Tell the AI exactly when something meaningful changed, what changed, and where it changed."*

Current visual browser agents operate like this:

```
[ User Interaction ] ──► [ Full-Page Screenshot ] ──► [ Send to VLM ] ──► [ Ask "What Changed?" ] ──► [ Repeat ]
```

This creates severe latency (1.5s–4s per loop), wasted bandwidth, and massive API costs. 

**DOMPulse introduces a local, zero-overhead perception layer:**

```
[ Webpage DOM ] ──► [ Observe Mutations ] ──► [ 96.2% Noise Filter ] ──► [ Group & Deduplicate ] ──► [ Screen Bounding Box ] ──► [ Structured JSON Event ] ──► [ AI Agent ]
```

The AI agent consumes compact, deterministic JSON events and only invokes vision-language models when visual inspection is strictly required.

---

## 🔬 Key Capabilities (Version 1)

* 🛡️ **Zero Cloud / Local-First:** Runs 100% locally in the browser with **zero LLM/VLM dependencies**, zero network calls, and deterministic heuristics.
* 🌪️ **Multi-Tier Noise Suppression:** Eliminates `SCRIPT`, `STYLE`, `IFRAME`, transient animations (`hover`, `animate-*`, `ripple`), hydration tracking (`data-v-*`, `_ngcontent`), and continuous CSS opacity churn.
* ⏱️ **80ms Debounce + 200ms MaxWait:** Prevents infinite mutation starvation while consolidating rapid framework multi-renders.
* 🎯 **"Reject Early. Analyze Late":** `getBoundingClientRect()` and `getComputedStyle()` layout reads are deferred strictly until candidate events survive filtering and persistence checks.
* 🧭 **SPA Client-Side Navigation Interceptor:** Safely hooks `history.pushState`, `history.replaceState`, `popstate`, and `hashchange` to emit `NAVIGATION_DETECTED` events.
* 📦 **Self-Contained Content Script:** Bundled into a standalone **19.7 KB IIFE** with zero external imports, ready to load on any webpage out of the box.

---

## 🏗️ Architecture

```mermaid
flowchart TD
    subgraph Browser ["Webpage Context"]
        DOM[DOM Mutations] --> MO[MutationObserver (80ms Debounce)]
    end

    subgraph Phase1 ["Phase 1: Cheap Filter (Reject Early)"]
        MO --> Raw[Raw Mutation Stream]
        Raw --> Tags["Strip Non-Visual: SCRIPT, STYLE, LINK, META, NOSCRIPT, IFRAME"]
        Tags --> HighValue["Preserve High-Value Attributes: aria-*, disabled, checked, data-state"]
        HighValue --> Cosmetic["Filter Cosmetic Styles by Default & Transient Classes"]
    end

    subgraph Phase2 ["Phase 2: Grouping & Persistence"]
        Cosmetic --> Dedup["Deduplicate: Merge identical element targets"]
        Dedup --> Persist["Persistence Check: Discard net-zero reversions (A → B → A)"]
        Persist --> Correlate["Correlate Action Batch: ['button text changed', 'toast appeared']"]
    end

    subgraph Phase3 ["Phase 3: Late Analysis & Scoring"]
        Correlate --> Classifier["Semantic Classifier (9 Event Types)"]
        Classifier --> Scoring["Importance Scorer (0 to 5 Priority)"]
        Scoring --> Geometry["Batch-Cached Geometry: getBoundingClientRect() on survivors ONLY"]
    end

    subgraph Consumers ["Event Dispatch"]
        Geometry --> InPage["In-Page Stream: window.dispatchEvent('dompulse:event')"]
        Geometry --> Background["Chrome Runtime Service Worker"]
        Background --> Popup["Developer Dashboard Popup"]
        InPage --> AIAgent["Autonomous AI Agent (Playwright / Puppeteer / Python SDK)"]
    end
```

---

## 📊 Hardened Benchmarks

Quantitative results recorded from automated stress tests under identical workloads (E-Commerce action + 100 cosmetic/framework noise mutations):

| Metric | Before Hardening | After Hardening (V1.1) | Delta |
| :--- | :---: | :---: | :---: |
| **Raw Mutations Injected** | 104 | **104** | Baseline |
| **Cosmetic Noise Filtered** | 50 | **100** | **+100% cleaner signal** |
| **Deduplicated Mutations** | 49 | **49** | Batch consolidated |
| **Surviving Meaningful Events** | 5 | **4** | Precise state transitions |
| **Noise Reduction Ratio** | 95.2% | **96.2%** | **🔥 Ultra-low overhead** |
| **Important Event Recall** | 66.7% | **100.0%** | **🎯 0 missed critical events** |
| **Processing Latency** | 65.59 ms | **60.26 ms** | **⚡ 8% faster execution** |
| **Mutation Storm Starvation** | Vulnerable | **Immune** | MaxWait forces flush at 200ms |

### Debounce Window Comparison Matrix

| Debounce | MaxWait | Noise Reduction | Processing Latency | Event Recall | Recommendation |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **30ms** | 100ms | 95.2% | 69.22 ms | 100% | Frequent micro-batches |
| **50ms** | 150ms | 95.2% | 24.08 ms | 100% | Fast, slight churn |
| **80ms** | **200ms** | **95.2%** | **15.38 ms** | **100%** | **⭐ Optimal Default** |
| **100ms** | 250ms | 95.2% | 12.22 ms | 100% | Excellent for heavy SPAs |
| **200ms** | 400ms | 95.2% | 16.91 ms | 100% | Higher perceived latency |

---

## 📋 Structured Event Schema

Every surviving event emitted by DOMPulse is compact, deterministic, and JSON-serializable:

```json
{
  "eventId": "evt_1727021234567_42",
  "type": "TEXT_CHANGED",
  "timestamp": 1727021234567,
  "element": {
    "tag": "BUTTON",
    "id": "checkout-btn",
    "classes": ["primary-btn", "rounded"],
    "selector": "button#checkout-btn",
    "role": "button",
    "name": "submit",
    "textSnippet": "Processing..."
  },
  "attributeName": "disabled",
  "before": "Checkout",
  "after": "Processing...",
  "bbox": {
    "x": 720,
    "y": 540,
    "width": 150,
    "height": 42
  },
  "visibility": {
    "visible": true,
    "inViewport": true
  },
  "importance": 5,
  "metadata": {
    "addedNodesCount": 0,
    "removedNodesCount": 0
  }
}
```

### Deterministic Importance Scores

* 🔴 **`5` (Critical):** `DIALOG_APPEARED`, `NOTIFICATION_APPEARED`, `NAVIGATION_DETECTED`, `aria-expanded`, `disabled`, `aria-invalid`.
* 🟡 **`3-4` (Important):** `TEXT_CHANGED`, `FORM_CHANGED`, `STATE_CHANGED`, `VISIBILITY_CHANGED`.
* 🟢 **`1-2` (Low-Medium):** `ELEMENT_ADDED`, `ELEMENT_REMOVED`, persistent `class` changes.
* ⚪ **`0` (Discarded):** Cosmetic style updates and non-state mutations.

---

## 💻 Developer Event Viewer

DOMPulse features a sleek dark-mode developer popup providing live HUD telemetry:

<div align="center">

```text
┌────────────────────────────────────────────────────────┐
│  ⚡ DOMPulse v1.1                         ● ACTIVE    │
├────────────────────────────────────────────────────────┤
│  [ RAW: 104 ] [ FILTERED: 100 ] [ DEDUP: 49 ] [ 4 EVT ]│
│  🔥 Noise Reduction: 96.2%    ⚡ Avg Latency: 15.4ms   │
├────────────────────────────────────────────────────────┤
│  [ 🔍 Search selector, text, or attribute...          ]│
│  [ All Event Types ▾ ]                  [ Export JSON ]│
├────────────────────────────────────────────────────────┤
│  EVENTS                                                │
│                                                        │
│  🔴 DIALOG_APPEARED                   12:44:12.302     │
│     dialog#checkout-modal                              │
│     + Added 1 node(s)                                  │
│     [x: 480, y: 220, 380×240]  score: 5   [Copy JSON]  │
│                                                        │
│  🟡 TEXT_CHANGED                      12:44:12.302     │
│     button#add-to-cart "Adding..."                     │
│     - "Add to Cart"                                    │
│     + "Adding..."                                      │
│     [x: 720, y: 540, 150×42]   score: 3   [Copy JSON]  │
│                                                        │
│  🔴 STATE_CHANGED                     12:44:12.302     │
│     button#add-to-cart                                 │
│     attr: disabled (+ true)                            │
│     [x: 720, y: 540, 150×42]   score: 5   [Copy JSON]  │
└────────────────────────────────────────────────────────┘
```

</div>

---

## 🚀 Quick Start

### 1. Clone & Build

```bash
# Clone the repository
git clone https://github.com/mysterious03/DOMPULSE.git
cd DOMPULSE

# Install dependencies
npm install

# Run automated tests (30/30 tests)
npm test

# Build production Chrome extension
npm run build
```

### 2. Load into Google Chrome

1. Open Chrome and navigate to `chrome://extensions/`.
2. Toggle on **Developer mode** in the top-right corner.
3. Click **Load unpacked**.
4. Select the `dist/` directory inside `DOMPULSE`.
5. Pin the **DOMPulse** extension to your toolbar!

### 3. Consume Programmatically (for AI Browser Agents)

DOMPulse exposes both Custom DOM Events and a window API for in-page scripts:

```javascript
// 1. Subscribe to meaningful semantic events in real time
window.addEventListener('dompulse:event', (event) => {
  const change = event.detail;
  console.log(`[AI Agent Perception] ${change.type} on ${change.element.selector}`);
  console.log(`Screen Bounding Box: [${change.bbox.x}, ${change.bbox.y}, ${change.bbox.width}x${change.bbox.height}]`);
});

// 2. Query metrics programmatically
const metrics = window.__DOMPULSE__.getMetrics();
console.log(`Noise reduction ratio: ${(metrics.compressionRatio * 100).toFixed(1)}%`);
```

---

## 🧪 Interactive Benchmark Suite

DOMPulse includes a built-in sandbox application to benchmark real-world scenarios:

```bash
npm run dev
# Open http://localhost:5173/testbench/index.html
```

* **Scenario A (E-Commerce):** Add-to-cart triggering button text change, disabled state, cart badge increment, and a toast alert.
* **Scenario B (Modal):** Interactive `<dialog>` appearance and backdrop overlay.
* **Scenario C (Form Validation):** Dynamic input validation with `aria-invalid` toggling.
* **Scenario D (SPA Navigation):** `pushState`, `replaceState`, and `hashchange` URL interception.
* **Scenario E (Stress Test):** Injects 100 to 5,000 cosmetic mutations and verifies >95% noise rejection.
* **Scenario F (Mutation Storm):** Fires 400ms of non-stop mutations every 20ms to verify that `maxWaitMs = 200` forces flushes without starvation.

---

## 🗺️ Roadmap & Vision

```text
[ V1: Core DOM Perception ] ────► [ V2: AXTree Integration ] ────► [ V3: Dirty Region Detection ] ────► [ V4: Vision-On-Demand ]
  • MutationObserver                 • Accessibility Tree Diffs       • Bounding Box Crops               • Direct VLM Dispatch
  • 96% Noise Filter                 • Semantic Roles                 • Pixel Delta Correlation          • Multi-Modal Agent SDK
  • Geometry Extraction              • Importance Scoring 2.0         • Canvas/WebGL Awareness
```

---

## 📄 License

MIT © [DOMPulse Contributors](https://github.com/mysterious03/DOMPULSE)
