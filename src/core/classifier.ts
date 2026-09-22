/**
 * DOMPulse Semantic Event Classifier & Importance Scorer
 * Maps raw DOM mutations to high-level semantic categories and assigns deterministic importance scores.
 */

import { SemanticEventType } from './types';

function isDialogElement(el: Element): boolean {
  if (el.tagName.toUpperCase() === 'DIALOG') return true;

  const role = el.getAttribute('role');
  if (role === 'dialog' || role === 'alertdialog') return true;

  const className = typeof el.className === 'string' ? el.className.toLowerCase() : '';
  return className.includes('modal') || className.includes('dialog-content') || className.includes('popup-dialog');
}

function isNotificationElement(el: Element): boolean {
  const role = el.getAttribute('role');
  if (role === 'alert' || role === 'status' || role === 'log') return true;

  const live = el.getAttribute('aria-live');
  if (live === 'assertive' || live === 'polite') return true;

  const className = typeof el.className === 'string' ? el.className.toLowerCase() : '';
  return className.includes('toast') || className.includes('alert') || className.includes('snackbar') || className.includes('notification');
}

function isFormElement(el: Element): boolean {
  const tag = el.tagName.toUpperCase();
  if (['INPUT', 'SELECT', 'TEXTAREA', 'FORM'].includes(tag)) return true;

  const role = el.getAttribute('role');
  return ['textbox', 'checkbox', 'combobox', 'listbox', 'radio', 'switch', 'slider'].includes(role || '');
}

/**
 * Classifies an attribute change into a semantic event type.
 */
export function classifyAttributeMutation(
  target: Element,
  attrName: string,
  _oldValue: string | null,
  _newValue: string | null
): SemanticEventType {
  const lowerAttr = attrName.toLowerCase();

  // Visibility changes
  if (
    lowerAttr === 'hidden' ||
    lowerAttr === 'aria-hidden' ||
    (lowerAttr === 'style' && (_newValue?.includes('display') || _newValue?.includes('visibility')))
  ) {
    return 'VISIBILITY_CHANGED';
  }

  // Dialog open state
  if (lowerAttr === 'open' && isDialogElement(target)) {
    return 'DIALOG_APPEARED';
  }

  // Form field state changes
  if (
    isFormElement(target) ||
    ['value', 'checked', 'selected', 'disabled', 'required', 'aria-invalid'].includes(lowerAttr)
  ) {
    return 'FORM_CHANGED';
  }

  // Interactive state changes (expanded, selected, checked, disabled, etc.)
  if (
    lowerAttr.startsWith('aria-') ||
    lowerAttr.startsWith('data-state') ||
    lowerAttr === 'disabled'
  ) {
    return 'STATE_CHANGED';
  }

  return 'ATTRIBUTE_CHANGED';
}

/**
 * Classifies a childList mutation into a semantic event type.
 * Prioritizes strong signals: Dialog > Alert > Text replacement > Elements.
 */
export function classifyChildListMutation(mutation: MutationRecord): SemanticEventType {
  const added = Array.from(mutation.addedNodes);
  const removed = Array.from(mutation.removedNodes);

  // 1. Check for Dialog / Modal insertions
  for (const node of added) {
    if (node instanceof Element && isDialogElement(node)) {
      return 'DIALOG_APPEARED';
    }
  }

  // 2. Check for Notification / Toast insertions
  for (const node of added) {
    if (node instanceof Element && isNotificationElement(node)) {
      return 'NOTIFICATION_APPEARED';
    }
  }

  if (mutation.target instanceof Element) {
    if (isDialogElement(mutation.target)) return 'DIALOG_APPEARED';
    if (isNotificationElement(mutation.target)) return 'NOTIFICATION_APPEARED';
  }

  // 3. Check if all added and removed nodes are Text nodes (e.g. textContent replacement)
  const isAllTextNodes =
    (added.length > 0 || removed.length > 0) &&
    added.every((n) => n.nodeType === Node.TEXT_NODE) &&
    removed.every((n) => n.nodeType === Node.TEXT_NODE);

  if (isAllTextNodes) {
    return 'TEXT_CHANGED';
  }

  // 4. Form modifications
  if (mutation.target instanceof Element && isFormElement(mutation.target)) {
    return 'FORM_CHANGED';
  }

  if (added.length > 0) return 'ELEMENT_ADDED';
  if (removed.length > 0) return 'ELEMENT_REMOVED';

  return 'ELEMENT_ADDED';
}

export function classifyCharacterDataMutation(_mutation: MutationRecord): SemanticEventType {
  return 'TEXT_CHANGED';
}

/**
 * Computes deterministic importance score based on event category, attributes, and element semantics:
 * - DIALOG_APPEARED, NOTIFICATION_APPEARED, NAVIGATION_DETECTED, aria-expanded, disabled, aria-invalid: 5 (Critical)
 * - STATE_CHANGED, VISIBILITY_CHANGED: 4 (Important)
 * - TEXT_CHANGED, FORM_CHANGED, value, checked: 3 (Interesting)
 * - ELEMENT_ADDED, ELEMENT_REMOVED: 2 (Low-Medium)
 * - class change, generic ATTRIBUTE_CHANGED: 1 (Low)
 * - cosmetic style: 0 (Discard)
 */
export function computeImportanceScore(
  type: SemanticEventType,
  attrName?: string
): number {
  const lowerAttr = (attrName || '').toLowerCase();

  // Score 0: Cosmetic style changes
  if (lowerAttr === 'style') {
    return 0;
  }

  // Score 5: Critical signals
  if (
    type === 'DIALOG_APPEARED' ||
    type === 'NOTIFICATION_APPEARED' ||
    type === 'NAVIGATION_DETECTED' ||
    lowerAttr === 'aria-expanded' ||
    lowerAttr === 'disabled' ||
    lowerAttr === 'aria-invalid'
  ) {
    return 5;
  }

  // Score 4: Important state / visibility transitions
  if (type === 'STATE_CHANGED' || type === 'VISIBILITY_CHANGED') {
    return 4;
  }

  // Score 3: Interactive and textual feedback
  if (
    type === 'TEXT_CHANGED' ||
    type === 'FORM_CHANGED' ||
    lowerAttr === 'value' ||
    lowerAttr === 'checked'
  ) {
    return 3;
  }

  // Score 2: Structural tree modifications
  if (type === 'ELEMENT_ADDED' || type === 'ELEMENT_REMOVED') {
    return 2;
  }

  // Score 1: Class changes or generic attributes
  if (lowerAttr === 'class' || type === 'ATTRIBUTE_CHANGED') {
    return 1;
  }

  return 1;
}
