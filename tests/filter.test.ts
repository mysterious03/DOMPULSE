import { describe, it, expect } from 'vitest';
import {
  isIgnoredNode,
  filterAttributeMutation,
  filterCharacterDataMutation,
} from '../src/core/filter';

describe('DOMPulse Noise Filter', () => {
  it('correctly identifies ignored script, style, and metadata nodes', () => {
    const scriptEl = document.createElement('script');
    const styleEl = document.createElement('style');
    const divEl = document.createElement('div');
    const childSpan = document.createElement('span');
    scriptEl.appendChild(childSpan);

    expect(isIgnoredNode(scriptEl)).toBe(true);
    expect(isIgnoredNode(styleEl)).toBe(true);
    expect(isIgnoredNode(childSpan)).toBe(true); // inside script
    expect(isIgnoredNode(divEl)).toBe(false);
  });

  it('filters identical attribute values as noise', () => {
    const btn = document.createElement('button');
    const result = filterAttributeMutation(btn, 'class', 'primary-btn', 'primary-btn');
    expect(result.passed).toBe(false);
    expect(result.reason).toBe('identical_attribute_value');
  });

  it('filters framework internal attributes', () => {
    const div = document.createElement('div');
    const res1 = filterAttributeMutation(div, 'data-v-12345', null, 'true');
    const res2 = filterAttributeMutation(div, 'data-reactid', '1', '2');
    const res3 = filterAttributeMutation(div, '_ngcontent-c12', null, '');

    expect(res1.passed).toBe(false);
    expect(res2.passed).toBe(false);
    expect(res3.passed).toBe(false);
  });

  it('preserves critical semantic attributes', () => {
    const btn = document.createElement('button');
    const input = document.createElement('input');

    expect(filterAttributeMutation(btn, 'disabled', null, '').passed).toBe(true);
    expect(filterAttributeMutation(btn, 'aria-expanded', 'false', 'true').passed).toBe(true);
    expect(filterAttributeMutation(btn, 'aria-hidden', 'true', 'false').passed).toBe(true);
    expect(filterAttributeMutation(input, 'checked', null, '').passed).toBe(true);
    expect(filterAttributeMutation(btn, 'data-state', 'closed', 'open').passed).toBe(true);
  });

  it('filters transient animation classes but preserves semantic state classes', () => {
    const div = document.createElement('div');

    // Purely transient animation class on a div
    const animRes = filterAttributeMutation(
      div,
      'class',
      'box',
      'box animate-spin'
    );
    expect(animRes.passed).toBe(false);

    // Semantic state class (active / hidden / open)
    const stateRes = filterAttributeMutation(
      div,
      'class',
      'accordion-item',
      'accordion-item active'
    );
    expect(stateRes.passed).toBe(true);
  });

  it('filters cosmetic style changes by default', () => {
    const div = document.createElement('div');
    const styleRes = filterAttributeMutation(div, 'style', 'opacity: 0.51;', 'opacity: 0.52;');
    expect(styleRes.passed).toBe(false);
    expect(styleRes.reason).toBe('cosmetic_style_change_ignored_by_default');

    // Keeps display: none toggles
    const visibilityRes = filterAttributeMutation(div, 'style', 'display: none', 'display: block');
    expect(visibilityRes.passed).toBe(true);
  });

  it('ignores extension own DOM elements', () => {
    const extRoot = document.createElement('div');
    extRoot.id = 'dompulse-overlay';
    const child = document.createElement('span');
    extRoot.appendChild(child);

    expect(isIgnoredNode(extRoot)).toBe(true);
    expect(isIgnoredNode(child)).toBe(true);
  });
});
