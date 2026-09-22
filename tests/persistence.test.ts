import { describe, it, expect } from 'vitest';
import { processAndGroupMutations } from '../src/core/grouping';

describe('DOMPulse Persistence & Net-Change Detection', () => {
  it('discards A -> B -> A attribute toggles where net change is zero', () => {
    const btn = document.createElement('button');
    btn.setAttribute('aria-expanded', 'false');

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
    btn.setAttribute('aria-expanded', 'false'); // Reverted back to false

    const { batch } = processAndGroupMutations([rec1, rec2]);
    expect(batch.events.length).toBe(0);
  });

  it('preserves A -> B state changes', () => {
    const btn = document.createElement('button');
    btn.setAttribute('aria-expanded', 'false');

    const rec = {
      type: 'attributes',
      target: btn,
      attributeName: 'aria-expanded',
      oldValue: 'false',
    } as unknown as MutationRecord;
    btn.setAttribute('aria-expanded', 'true');

    const { batch } = processAndGroupMutations([rec]);
    expect(batch.events.length).toBe(1);
    expect(batch.events[0].before).toBe('false');
    expect(batch.events[0].after).toBe('true');
  });

  it('collapses A -> B -> C state transitions to before: A, after: C', () => {
    const input = document.createElement('input');
    input.setAttribute('value', 'A');

    const rec1 = {
      type: 'attributes',
      target: input,
      attributeName: 'value',
      oldValue: 'A',
    } as unknown as MutationRecord;
    input.setAttribute('value', 'B');

    const rec2 = {
      type: 'attributes',
      target: input,
      attributeName: 'value',
      oldValue: 'B',
    } as unknown as MutationRecord;
    input.setAttribute('value', 'C');

    const { batch } = processAndGroupMutations([rec1, rec2]);
    expect(batch.events.length).toBe(1);
    expect(batch.events[0].before).toBe('A');
    expect(batch.events[0].after).toBe('C');
  });

  it('discards text A -> B -> A reversions', () => {
    const span = document.createElement('span');
    span.textContent = 'Hello';
    const textNode = span.firstChild!;

    const rec1 = {
      type: 'characterData',
      target: textNode,
      oldValue: 'Hello',
    } as unknown as MutationRecord;
    textNode.textContent = 'World';

    const rec2 = {
      type: 'characterData',
      target: textNode,
      oldValue: 'World',
    } as unknown as MutationRecord;
    textNode.textContent = 'Hello'; // Reverted!

    const { batch } = processAndGroupMutations([rec1, rec2]);
    expect(batch.events.length).toBe(0);
  });
});
