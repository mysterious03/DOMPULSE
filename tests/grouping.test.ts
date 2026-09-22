import { describe, it, expect } from 'vitest';
import { processAndGroupMutations } from '../src/core/grouping';

describe('DOMPulse Grouping & Deduplication', () => {
  it('deduplicates rapid characterData mutations on the same text node', () => {
    const p = document.createElement('p');
    p.textContent = 'Count: 3';
    const textNode = p.firstChild!;

    const rawRecords: MutationRecord[] = [
      {
        type: 'characterData',
        target: textNode,
        oldValue: 'Count: 0',
      } as unknown as MutationRecord,
      {
        type: 'characterData',
        target: textNode,
        oldValue: 'Count: 1',
      } as unknown as MutationRecord,
      {
        type: 'characterData',
        target: textNode,
        oldValue: 'Count: 2',
      } as unknown as MutationRecord,
    ];

    const { batch, rawCount, filteredCount } = processAndGroupMutations(rawRecords);

    expect(rawCount).toBe(3);
    expect(filteredCount).toBe(0);
    // Should collapse into 1 event with initial before ('Count: 0') and current after ('Count: 3')
    expect(batch.events.length).toBe(1);
    expect(batch.events[0].type).toBe('TEXT_CHANGED');
    expect(batch.events[0].before).toBe('Count: 0');
    expect(batch.events[0].after).toBe('Count: 3');
  });

  it('consolidates multi-child insertions into a single container event', () => {
    const ul = document.createElement('ul');
    const li1 = document.createElement('li');
    li1.textContent = 'Item 1';
    const li2 = document.createElement('li');
    li2.textContent = 'Item 2';
    ul.appendChild(li1);
    ul.appendChild(li2);

    const record1 = {
      type: 'childList',
      target: ul,
      addedNodes: [li1] as unknown as NodeList,
      removedNodes: [] as unknown as NodeList,
    } as MutationRecord;

    const record2 = {
      type: 'childList',
      target: ul,
      addedNodes: [li2] as unknown as NodeList,
      removedNodes: [] as unknown as NodeList,
    } as MutationRecord;

    const { batch, rawCount } = processAndGroupMutations([record1, record2]);

    expect(rawCount).toBe(2);
    expect(batch.events.length).toBe(1);
    expect(batch.events[0].metadata?.addedNodesCount).toBe(2);
    expect(batch.events[0].after).toBe('Added 2 node(s)');
  });

  it('discards transient mutations that revert to their initial value within the batch', () => {
    const btn = document.createElement('button');
    btn.setAttribute('aria-expanded', 'false');

    // Sequence: false -> true -> false (transient toggle that ended back at false)
    const rec1 = {
      type: 'attributes',
      target: btn,
      attributeName: 'aria-expanded',
      oldValue: 'false',
    } as unknown as MutationRecord;
    btn.setAttribute('aria-expanded', 'true');

    const rec2 = {
      type: 'attributes',
      target: btn,
      attributeName: 'aria-expanded',
      oldValue: 'true',
    } as unknown as MutationRecord;
    btn.setAttribute('aria-expanded', 'false'); // reverted!

    const { batch } = processAndGroupMutations([rec1, rec2]);
    // The net state change was false -> false, so it should be discarded
    expect(batch.events.length).toBe(0);
  });

  it('generates correlated change summaries on the batch level', () => {
    const btn = document.createElement('button');
    btn.id = 'cart-btn';
    btn.setAttribute('disabled', '');

    const record = {
      type: 'attributes',
      target: btn,
      attributeName: 'disabled',
      oldValue: null,
    } as unknown as MutationRecord;

    const { batch } = processAndGroupMutations([record]);
    expect(batch.events.length).toBe(1);
    expect(batch.changes.length).toBe(1);
    expect(batch.changes[0]).toContain('disabled changed');
  });
});
