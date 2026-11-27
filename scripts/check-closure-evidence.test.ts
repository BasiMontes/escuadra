import { describe, expect, test } from 'bun:test';
import { findClosedWithoutEvidence, findDefectsWithoutTraceability, parseDays } from './check-closure-evidence';

/** The closure-evidence check keeps the metric reproducible. */

const issue = (key: string, commentCount: number) => ({ key, summary: `summary ${key}`, issueType: 'Tarea', commentCount, hasParent: true, linkCount: 1 });

describe('findClosedWithoutEvidence', () => {
  test('keeps only the closed tickets with zero comments', () => {
    const result = findClosedWithoutEvidence([issue('APP-1', 0), issue('APP-2', 1), issue('APP-3', 4), issue('APP-4', 0)]);

    expect(result.map(i => i.key)).toEqual(['APP-1', 'APP-4']);
  });

  test('is empty when every closed ticket has a comment', () => {
    expect(findClosedWithoutEvidence([issue('APP-1', 1), issue('APP-2', 2)])).toEqual([]);
  });
});

describe('parseDays', () => {
  test('defaults to 7 days', () => {
    expect(parseDays([])).toBe(7);
  });

  test('reads --days', () => {
    expect(parseDays(['--days', '14'])).toBe(14);
  });

  test.each([['0'], ['-3'], ['abc'], ['1.5']])('rejects %s', (value) => {
    expect(() => parseDays(['--days', value])).toThrow('--days needs a positive whole number');
  });
});

/**
 * A defect is traceable when it has an epic (`parent`) and a link to what it
 * regressed. Measured over the same recent window as the evidence rule.
 */
const defect = (key: string, extra: { hasParent?: boolean, linkCount?: number, issueType?: string } = {}) => ({
  key,
  summary: `summary ${key}`,
  issueType: extra.issueType ?? 'Error',
  commentCount: 1,
  hasParent: extra.hasParent ?? true,
  linkCount: extra.linkCount ?? 1,
});

describe('findDefectsWithoutTraceability', () => {
  test.each(['Bug', 'Defect', 'Error'])('treats %s as a defect type', (issueType) => {
    expect(findDefectsWithoutTraceability([defect('APP-0', { issueType, linkCount: 0 })])).toHaveLength(1);
  });

  test('flags a defect with no epic, saying so', () => {
    expect(findDefectsWithoutTraceability([defect('APP-1', { hasParent: false })]))
      .toEqual([{ issue: defect('APP-1', { hasParent: false }), missing: ['epic'] }]);
  });

  test('flags a defect with no link, saying so', () => {
    expect(findDefectsWithoutTraceability([defect('APP-2', { linkCount: 0 })])[0].missing).toEqual(['link']);
  });

  test('says both when it has neither', () => {
    expect(findDefectsWithoutTraceability([defect('APP-3', { hasParent: false, linkCount: 0 })])[0].missing).toEqual(['epic', 'link']);
  });

  test('a defect with an epic and a link is fine', () => {
    expect(findDefectsWithoutTraceability([defect('APP-4')])).toEqual([]);
  });

  test('never looks at other ticket kinds, which have their own rules', () => {
    const tasks = [defect('APP-5', { issueType: 'Tarea', hasParent: false, linkCount: 0 }), defect('APP-6', { issueType: 'Historia', hasParent: false })];

    expect(findDefectsWithoutTraceability(tasks)).toEqual([]);
  });

  test('reports only the untraceable defects of a mixed list, in order', () => {
    const result = findDefectsWithoutTraceability([defect('APP-7'), defect('APP-8', { linkCount: 0 }), defect('APP-9', { hasParent: false }), defect('APP-10')]);

    expect(result.map(r => r.issue.key)).toEqual(['APP-8', 'APP-9']);
  });
});
