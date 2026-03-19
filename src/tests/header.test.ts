import { describe, it, expect } from 'vitest';
import {
  supportsLanguage,
  extractHeader,
  getHeaderInfo,
  renderHeader,
  HeaderInfo
} from '../header';

const makeInfo = (overrides?: Partial<HeaderInfo>): HeaderInfo => ({
  filename: 'test.c',
  author: 'nicopasla <nicopasla@student.42belgium.be>',
  createdBy: 'nicopasla',
  createdAt: new Date(2026, 2, 19, 14, 30, 0),
  updatedBy: 'nicopasla',
  updatedAt: new Date(2026, 5, 1, 9, 0, 0),
  ...overrides
});


describe('supportsLanguage', () => {
  it('returns true for supported languages', () => {
    expect(supportsLanguage('c')).toBe(true);
    expect(supportsLanguage('python')).toBe(true);
    expect(supportsLanguage('typescript')).toBe(true);
  });

  it('returns false for unsupported languages', () => {
    expect(supportsLanguage('brainfuck')).toBe(false);
    expect(supportsLanguage('')).toBe(false);
  });
});


describe('extractHeader', () => {
  it('returns null when there is no header', () => {
    expect(extractHeader('int main() {}')).toBeNull();
    expect(extractHeader('')).toBeNull();
  });

  it('extracts a valid header from a rendered file', () => {
    const rendered = renderHeader('c', makeInfo());
    expect(extractHeader(rendered)).not.toBeNull();
  });

  it('extracts header even when followed by file content', () => {
    const rendered = renderHeader('c', makeInfo());
    const withContent = rendered + '\nint main() {}\n';
    expect(extractHeader(withContent)).not.toBeNull();
  });

  it('normalizes CRLF to LF', () => {
    const rendered = renderHeader('c', makeInfo());
    const crlf = rendered.replace(/\n/g, '\r\n');
    const extracted = extractHeader(crlf);
    expect(extracted).not.toBeNull();
    expect(extracted!.includes('\r\n')).toBe(false);
  });
});


describe('renderHeader', () => {
  it('throws for unsupported language', () => {
    expect(() => renderHeader('brainfuck', makeInfo())).toThrow();
  });

  it('renders a header with correct line count', () => {
  const rendered = renderHeader('c', makeInfo());
  expect(rendered.trim().split('\n')).toHaveLength(11);
  });

  it('uses correct delimiters for c', () => {
    const rendered = renderHeader('c', makeInfo());
    expect(rendered.startsWith('/* ')).toBe(true);
  });

  it('uses correct delimiters for python', () => {
    const rendered = renderHeader('python', makeInfo({ filename: 'test.py' }));
    expect(rendered.startsWith('# ')).toBe(true);
  });

  it('uses correct delimiters for ocaml', () => {
    const rendered = renderHeader('ocaml', makeInfo({ filename: 'test.ml' }));
    expect(rendered.startsWith('(* ')).toBe(true);
  });

  it('contains the filename', () => {
    const rendered = renderHeader('c', makeInfo({ filename: 'main.c' }));
    expect(rendered).toContain('main.c');
  });

  it('contains the author', () => {
    const rendered = renderHeader('c', makeInfo());
    expect(rendered).toContain('nicopasla');
  });
});


describe('getHeaderInfo', () => {
  it('returns empty fallback for invalid header', () => {
    const info = getHeaderInfo('not a header at all');
    expect(info.filename).toBe('');
    expect(info.author).toBe('');
  });

  it('correctly parses all fields from a rendered header', () => {
    const original = makeInfo();
    const rendered = renderHeader('c', original);
    const extracted = extractHeader(rendered)!;
    const parsed = getHeaderInfo(extracted);

    expect(parsed.filename).toBe('test.c');
    expect(parsed.author).toBe('nicopasla <nicopasla@student.42belgium.be>');
    expect(parsed.createdBy).toBe('nicopasla');
    expect(parsed.updatedBy).toBe('nicopasla');
  });
});


describe('render → extract → parse roundtrip', () => {
  it('preserves createdAt exactly', () => {
    const original = makeInfo();
    const rendered = renderHeader('c', original);
    const parsed = getHeaderInfo(extractHeader(rendered)!);

    expect(parsed.createdAt.getTime()).toBe(original.createdAt.getTime());
  });

  it('preserves updatedAt exactly', () => {
    const original = makeInfo();
    const rendered = renderHeader('c', original);
    const parsed = getHeaderInfo(extractHeader(rendered)!);

    expect(parsed.updatedAt.getTime()).toBe(original.updatedAt.getTime());
  });

  it('roundtrip works for all delimiter types', () => {
    const langs = ['c', 'python', 'haskell', 'ocaml', 'latex', 'ini'];
    for (const lang of langs) {
      const original = makeInfo({ filename: `test.${lang}` });
      const rendered = renderHeader(lang, original);
      const parsed = getHeaderInfo(extractHeader(rendered)!);

      expect(parsed.createdAt.getTime()).toBe(original.createdAt.getTime());
      expect(parsed.filename).toBe(`test.${lang}`);
    }
  });
});