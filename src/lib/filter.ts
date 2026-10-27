/**
 * @file filter.ts
 * @author: ForUltraplayer
 * @brief 디바이스·카테고리 필터, 검색, 개수 집계, URL 파라미터 해석, 정렬 순수 함수
 */
import { CATEGORIES, type Category } from './categories';
import { DEVICES, type Device } from './devices';

export type DeviceFilter = Device | 'all';
export type CategoryFilter = Category | 'all';

export interface Filterable {
  title: string;
  summary: string;
  devices: readonly Device[];
  category?: Category;
}

export function normalizeText(s: string): string {
  return s.normalize('NFC').toLowerCase().trim().replace(/\s+/g, ' ');
}

export function matchesItem(
  item: Filterable,
  device: DeviceFilter,
  query: string,
  category: CategoryFilter = 'all',
): boolean {
  if (device !== 'all' && !item.devices.includes(device)) return false;
  if (category !== 'all' && item.category !== category) return false;
  const q = normalizeText(query);
  if (q === '') return true;
  const haystack = normalizeText(`${item.title} ${item.summary}`);
  return q.split(' ').every((token) => haystack.includes(token));
}

export function countByDevice(items: readonly Filterable[], query: string): Record<DeviceFilter, number> {
  const counts: Record<DeviceFilter, number> = { all: 0, windows: 0, android: 0, web: 0 };
  for (const key of ['all', ...DEVICES] as DeviceFilter[]) {
    counts[key] = items.filter((i) => matchesItem(i, key, query)).length;
  }
  return counts;
}

export function parseDeviceParam(value: string | null): DeviceFilter {
  return (DEVICES as readonly string[]).includes(value ?? '') ? (value as Device) : 'all';
}

// 카테고리 줄은 디바이스 탭을 골랐을 때만 쓰므로 'all'이면 빈 목록이다.
// 검색어와 상관없이 정해 두어야 입력 중에 버튼이 사라지지 않는다.
export function categoriesFor(items: readonly Filterable[], device: DeviceFilter): Category[] {
  if (device === 'all') return [];
  const present = new Set(items.filter((i) => i.devices.includes(device)).map((i) => i.category));
  return CATEGORIES.filter((c) => present.has(c));
}

export function countByCategory(
  items: readonly Filterable[],
  device: DeviceFilter,
  query: string,
): Partial<Record<CategoryFilter, number>> {
  const counts: Partial<Record<CategoryFilter, number>> = {
    all: items.filter((i) => matchesItem(i, device, query)).length,
  };
  for (const c of categoriesFor(items, device)) {
    counts[c] = items.filter((i) => matchesItem(i, device, query, c)).length;
  }
  return counts;
}

export function parseCategoryParam(value: string | null): CategoryFilter {
  return (CATEGORIES as readonly string[]).includes(value ?? '') ? (value as Category) : 'all';
}

export function sortItems<T extends { title: string; order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'ko'));
}
