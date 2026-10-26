/**
 * @file filter.ts
 * @author: ForUltraplayer
 * @brief 디바이스 필터, 검색, 개수 집계, URL 파라미터 해석, 정렬 순수 함수
 */
import { DEVICES, type Device } from './devices';

export type DeviceFilter = Device | 'all';

export interface Filterable {
  title: string;
  summary: string;
  devices: readonly Device[];
}

export function normalizeText(s: string): string {
  return s.normalize('NFC').toLowerCase().trim().replace(/\s+/g, ' ');
}

export function matchesItem(item: Filterable, device: DeviceFilter, query: string): boolean {
  if (device !== 'all' && !item.devices.includes(device)) return false;
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

export function sortItems<T extends { title: string; order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'ko'));
}
