import { describe, it, expect } from 'vitest';
import {
  classifyAttributeMutation,
  classifyChildListMutation,
  computeImportanceScore,
} from '../src/core/classifier';

describe('DOMPulse Semantic Classifier', () => {
  it('classifies dialog and modal appearances', () => {
    const dialog = document.createElement('dialog');
    const divModal = document.createElement('div');
    divModal.setAttribute('role', 'dialog');

    expect(classifyAttributeMutation(dialog, 'open', null, '')).toBe('DIALOG_APPEARED');

    const fakeRecord = {
      type: 'childList',
      target: document.body,
      addedNodes: [divModal] as unknown as NodeList,
      removedNodes: [] as unknown as NodeList,
    } as MutationRecord;

    expect(classifyChildListMutation(fakeRecord)).toBe('DIALOG_APPEARED');
  });

  it('classifies toast/alert notifications', () => {
    const toast = document.createElement('div');
    toast.setAttribute('role', 'alert');
    toast.textContent = 'Item added to cart';

    const fakeRecord = {
      type: 'childList',
      target: document.body,
      addedNodes: [toast] as unknown as NodeList,
      removedNodes: [] as unknown as NodeList,
    } as MutationRecord;

    expect(classifyChildListMutation(fakeRecord)).toBe('NOTIFICATION_APPEARED');
  });

  it('classifies form element interactions', () => {
    const input = document.createElement('input');
    input.type = 'checkbox';

    expect(classifyAttributeMutation(input, 'checked', null, '')).toBe('FORM_CHANGED');
    expect(classifyAttributeMutation(input, 'disabled', null, '')).toBe('FORM_CHANGED');
  });

  it('classifies visibility mutations', () => {
    const section = document.createElement('section');
    expect(classifyAttributeMutation(section, 'hidden', null, '')).toBe('VISIBILITY_CHANGED');
    expect(classifyAttributeMutation(section, 'aria-hidden', 'true', 'false')).toBe('VISIBILITY_CHANGED');
    expect(classifyAttributeMutation(section, 'style', 'display: none', 'display: block')).toBe('VISIBILITY_CHANGED');
  });

  it('classifies general aria states as STATE_CHANGED', () => {
    const button = document.createElement('button');
    expect(classifyAttributeMutation(button, 'aria-expanded', 'false', 'true')).toBe('STATE_CHANGED');
    expect(classifyAttributeMutation(button, 'data-state', 'inactive', 'active')).toBe('STATE_CHANGED');
  });

  it('computes importance scores correctly', () => {
    // Critical (5)
    expect(computeImportanceScore('DIALOG_APPEARED')).toBe(5);
    expect(computeImportanceScore('NOTIFICATION_APPEARED')).toBe(5);
    expect(computeImportanceScore('STATE_CHANGED', 'aria-expanded')).toBe(5);
    expect(computeImportanceScore('STATE_CHANGED', 'disabled')).toBe(5);

    // Interesting (3)
    expect(computeImportanceScore('TEXT_CHANGED')).toBe(3);
    expect(computeImportanceScore('FORM_CHANGED', 'value')).toBe(3);

    // Low (2 / 1)
    expect(computeImportanceScore('ELEMENT_ADDED')).toBe(2);
    expect(computeImportanceScore('ELEMENT_REMOVED')).toBe(2);
    expect(computeImportanceScore('ATTRIBUTE_CHANGED', 'class')).toBe(1);

    // Discard (0)
    expect(computeImportanceScore('ATTRIBUTE_CHANGED', 'style')).toBe(0);
  });
});
