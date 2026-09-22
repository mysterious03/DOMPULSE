/**
 * DOMPulse Observer Module
 * Encapsulates the MutationObserver lifecycle with debounced buffering
 * and configurable maxWait boundary to prevent mutation starvation.
 */

import { EngineConfig } from './types';

export type MutationFlushCallback = (mutations: MutationRecord[]) => void;

export class DOMObserver {
  private observer: MutationObserver | null = null;
  private buffer: MutationRecord[] = [];
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private maxWaitTimer: ReturnType<typeof setTimeout> | null = null;
  private config: EngineConfig;
  private onFlush: MutationFlushCallback;
  private isObserving = false;

  constructor(config: EngineConfig, onFlush: MutationFlushCallback) {
    this.config = config;
    this.onFlush = onFlush;
  }

  /**
   * Starts observing the document DOM.
   */
  public start(root: Node = document.documentElement): void {
    if (this.isObserving) return;

    if (typeof MutationObserver === 'undefined') {
      console.warn('[DOMPulse] MutationObserver not available in current environment.');
      return;
    }

    this.observer = new MutationObserver(this.handleMutations.bind(this));

    this.observer.observe(root, {
      childList: this.config.observeChildList,
      subtree: this.config.observeSubtree,
      attributes: this.config.observeAttributes,
      attributeOldValue: true,
      characterData: this.config.observeCharacterData,
      characterDataOldValue: true,
    });

    this.isObserving = true;
  }

  /**
   * Stops and disconnects the observer, clearing timers and pending buffer.
   */
  public stop(): void {
    this.clearTimers();
    this.buffer = [];
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.isObserving = false;
  }

  /**
   * Pauses observation temporarily.
   */
  public pause(): void {
    this.clearTimers();
    if (this.observer) {
      this.observer.disconnect();
    }
    this.isObserving = false;
  }

  /**
   * Resumes observation.
   */
  public resume(root: Node = document.documentElement): void {
    if (!this.isObserving) {
      this.start(root);
    }
  }

  public getStatus(): boolean {
    return this.isObserving;
  }

  /**
   * Immediately flushes any buffered mutations.
   */
  public flush(): void {
    this.clearTimers();
    if (this.buffer.length > 0) {
      const records = [...this.buffer];
      this.buffer = [];
      try {
        this.onFlush(records);
      } catch (err) {
        console.error('[DOMPulse] Error in flush callback:', err);
      }
    }
  }

  private clearTimers(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.maxWaitTimer) {
      clearTimeout(this.maxWaitTimer);
      this.maxWaitTimer = null;
    }
  }

  private handleMutations(mutations: MutationRecord[]): void {
    this.buffer.push(...mutations);

    // 1. If maxWaitTimer is not active, set it to guarantee upper bound execution
    if (!this.maxWaitTimer && this.config.maxWaitMs > 0) {
      this.maxWaitTimer = setTimeout(() => {
        this.flush();
      }, this.config.maxWaitMs);
    }

    // 2. Trailing debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.flush();
    }, this.config.debounceMs);
  }
}
