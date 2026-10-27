/**
 * @file category.test.ts
 * @author: ForUltraplayer
 * @brief 카테고리 필터·집계·URL 파라미터와 스키마 검증 단위 테스트
 */
import { expect, test } from 'vitest';
import { CATEGORIES, CATEGORY_LABELS } from '../src/lib/categories';
import { categoriesFor, countByCategory, matchesItem, parseCategoryParam } from '../src/lib/filter';
import { itemSchema } from '../src/lib/schema';

const items = [
  { title: 'GPU-Z', summary: '그래픽카드 사양 확인', devices: ['windows'], category: 'gpu' },
  { title: 'FurMark', summary: 'GPU 부하 테스트', devices: ['windows'], category: 'gpu' },
  { title: 'CPU-Z', summary: 'CPU 사양 확인', devices: ['windows'], category: 'cpu-ram' },
  { title: 'Vencord', summary: 'Discord 클라이언트 모드', devices: ['windows', 'web'], category: 'mods' },
  { title: 'Morphe', summary: 'YouTube 앱 패치', devices: ['android'], category: 'mods' },
] as const;

test('카테고리 순서와 표기가 정해져 있다', () => {
  expect(CATEGORIES.slice(0, 4)).toEqual(['cpu-ram', 'gpu', 'storage', 'files']);
  expect(CATEGORY_LABELS.files).toBe('파일 관리');
  expect(CATEGORY_LABELS.mods).toBe('광고 제거·앱 개조');
});
test('matchesItem은 카테고리를 함께 적용하고 기본값은 all이다', () => {
  expect(matchesItem(items[0], 'windows', '', 'gpu')).toBe(true);
  expect(matchesItem(items[2], 'windows', '', 'gpu')).toBe(false);
  expect(matchesItem(items[2], 'windows', '')).toBe(true);
});
test('categoriesFor는 그 디바이스에 있는 카테고리만 정해진 순서로 돌려준다', () => {
  expect(categoriesFor(items, 'windows')).toEqual(['cpu-ram', 'gpu', 'mods']);
  expect(categoriesFor(items, 'web')).toEqual(['mods']);
  expect(categoriesFor(items, 'all')).toEqual([]);
});
test('countByCategory는 디바이스와 검색어를 반영한다', () => {
  expect(countByCategory(items, 'windows', '')).toEqual({ all: 4, 'cpu-ram': 1, gpu: 2, mods: 1 });
  expect(countByCategory(items, 'windows', '사양')).toEqual({ all: 2, 'cpu-ram': 1, gpu: 1, mods: 0 });
});
test('모르는 category 값은 all이 된다', () => {
  expect(parseCategoryParam('gpu')).toBe('gpu');
  expect(parseCategoryParam('nope')).toBe('all');
  expect(parseCategoryParam(null)).toBe('all');
});
test('스키마는 category를 필수로 받고 모르는 값을 거부한다', () => {
  const ok = { title: 'x', summary: 'y', devices: ['windows'], source: 'mine', repo: 'a/b', category: 'gpu' };
  const { category, ...noCategory } = ok;
  expect(itemSchema.safeParse(ok).success).toBe(true);
  expect(itemSchema.safeParse(noCategory).success).toBe(false);
  expect(itemSchema.safeParse({ ...ok, category: 'games' }).success).toBe(false);
});
