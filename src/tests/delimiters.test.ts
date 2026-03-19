import { describe, it, expect } from 'vitest';
import { languageDelimiters } from '../delimiters';

describe('languageDelimiters', () => {
  it('every delimiter pair has exactly 2 elements', () => {
    for (const [lang, pair] of Object.entries(languageDelimiters)) {
      expect(pair).toHaveLength(2);
    }
  });

  it('every delimiter is a non-empty string', () => {
    for (const [lang, [left, right]] of Object.entries(languageDelimiters)) {
      expect(typeof left).toBe('string');
      expect(typeof right).toBe('string');
      expect(left.length).toBeGreaterThan(0);
      expect(right.length).toBeGreaterThan(0);
    }
  });

  it('all delimiter pairs have matching widths', () => {
    for (const [lang, [left, right]] of Object.entries(languageDelimiters)) {
      expect(left.length).toBe(right.length);
    }
  });

  it('known slash languages use /* and */', () => {
    const slashLangs = ['c', 'cpp', 'javascript', 'typescript', 'rust', 'go'];
    for (const lang of slashLangs) {
      expect(languageDelimiters[lang][0]).toBe('/* ');
      expect(languageDelimiters[lang][1]).toBe(' */');
    }
  });

  it('known hash languages use # ', () => {
    const hashLangs = ['python', 'ruby', 'shellscript', 'makefile', 'yaml'];
    for (const lang of hashLangs) {
      expect(languageDelimiters[lang][0]).toBe('# ');
      expect(languageDelimiters[lang][1]).toBe(' #');
    }
  });

  it('ocaml and fsharp use (* and *)', () => {
    expect(languageDelimiters['ocaml'][0]).toBe('(* ');
    expect(languageDelimiters['fsharp'][0]).toBe('(* ');
  });

  it('haskell and lua use -- ', () => {
    expect(languageDelimiters['haskell'][0]).toBe('-- ');
    expect(languageDelimiters['lua'][0]).toBe('-- ');
  });

  it('latex uses %%', () => {
    expect(languageDelimiters['latex'][0]).toBe('%% ');
  });

  it('ini uses ;;', () => {
    expect(languageDelimiters['ini'][0]).toBe(';; ');
  });
});