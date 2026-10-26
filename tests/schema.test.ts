/**
 * @file schema.test.ts
 * @author: ForUltraplayer
 * @brief 항목 스키마(itemSchema, isOwned) 단위 테스트
 */
import { expect, test } from 'vitest';
import { itemSchema, isOwned, type Source } from '../src/lib/schema';

const ok = { title: 'x', summary: 'y', devices: ['windows'], source: 'mine', repo: 'a/b' };

test('정상 항목을 받고 order 기본값을 채운다', () => {
  expect(itemSchema.parse(ok).order).toBe(100);
});
test('repo와 website가 모두 없으면 거부한다', () => {
  const { repo, ...noLink } = ok;
  expect(itemSchema.safeParse(noLink).success).toBe(false);
});
test('website만 있어도 받는다', () => {
  const { repo, ...rest } = ok;
  expect(itemSchema.safeParse({ ...rest, website: 'https://vencord.dev/' }).success).toBe(true);
});
test('모르는 디바이스, 빈 디바이스 목록, 잘못된 repo 형식을 거부한다', () => {
  expect(itemSchema.safeParse({ ...ok, devices: ['mac'] }).success).toBe(false);
  expect(itemSchema.safeParse({ ...ok, devices: [] }).success).toBe(false);
  expect(itemSchema.safeParse({ ...ok, repo: 'https://github.com/a/b' }).success).toBe(false);
});
test('isOwned는 mine과 modified만 true다', () => {
  expect(['mine', 'modified', 'external'].map((s) => isOwned(s as Source))).toEqual([true, true, false]);
});
