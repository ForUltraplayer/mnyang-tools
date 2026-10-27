/**
 * @file list-filter.ts
 * @author: ForUltraplayer
 * @brief 목록 화면 클라이언트 필터: 디바이스 탭, 카테고리 줄, 검색, 개수 갱신, ?device=·?category= 동기화
 */
import { CATEGORIES, type Category } from '../lib/categories';
import { DEVICES, type Device } from '../lib/devices';
import {
  categoriesFor,
  countByCategory,
  countByDevice,
  matchesItem,
  parseCategoryParam,
  parseDeviceParam,
  type CategoryFilter,
  type DeviceFilter,
  type Filterable,
} from '../lib/filter';

const search = document.querySelector<HTMLInputElement>('#search');
const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('button.tab[data-device]'));
const catRow = document.querySelector<HTMLElement>('#categories');
const catButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('button.cat[data-category]'));
const empty = document.querySelector<HTMLElement>('#empty');
const cards = Array.from(document.querySelectorAll<HTMLElement>('#items [data-item]'));

const entries = cards.map((el) => {
  const cat = el.dataset.category ?? '';
  const item: Filterable = {
    title: el.dataset.title ?? '',
    summary: el.dataset.summary ?? '',
    devices: (el.dataset.devices ?? '')
      .split(' ')
      .filter((d): d is Device => (DEVICES as readonly string[]).includes(d)),
    category: (CATEGORIES as readonly string[]).includes(cat) ? (cat as Category) : undefined,
  };
  return { el, item };
});
const allItems = entries.map((e) => e.item);

const params = new URLSearchParams(location.search);
let device: DeviceFilter = parseDeviceParam(params.get('device'));
let category: CategoryFilter = validCategory(parseCategoryParam(params.get('category')));

// 현재 디바이스에 없는 카테고리는 'all'로 되돌린다.
function validCategory(c: CategoryFilter): CategoryFilter {
  return c !== 'all' && categoriesFor(allItems, device).includes(c) ? c : 'all';
}

function render(): void {
  const query = search?.value ?? '';
  let visible = 0;
  for (const { el, item } of entries) {
    const show = matchesItem(item, device, query, category);
    el.hidden = !show;
    if (show) visible++;
  }
  if (empty) empty.hidden = visible > 0;

  const deviceCounts = countByDevice(allItems, query);
  for (const tab of tabs) {
    const key = tab.dataset.device as DeviceFilter;
    tab.setAttribute('aria-pressed', String(key === device));
    const badge = tab.querySelector('[data-count]');
    if (badge) badge.textContent = String(deviceCounts[key]);
  }

  const available = categoriesFor(allItems, device);
  if (catRow) catRow.hidden = available.length < 2;
  const catCounts = countByCategory(allItems, device, query);
  for (const btn of catButtons) {
    const key = btn.dataset.category as CategoryFilter;
    btn.hidden = key !== 'all' && !available.includes(key);
    btn.setAttribute('aria-pressed', String(key === category));
    const badge = btn.querySelector('[data-count]');
    if (badge) badge.textContent = String(catCounts[key] ?? 0);
  }
}

function syncUrl(): void {
  const url = new URL(location.href);
  if (device === 'all') url.searchParams.delete('device');
  else url.searchParams.set('device', device);
  if (category === 'all') url.searchParams.delete('category');
  else url.searchParams.set('category', category);
  history.replaceState(null, '', url);
}

search?.addEventListener('input', render);
for (const tab of tabs) {
  tab.addEventListener('click', () => {
    device = parseDeviceParam(tab.dataset.device ?? null);
    category = 'all';
    syncUrl();
    render();
  });
}
for (const btn of catButtons) {
  btn.addEventListener('click', () => {
    category = validCategory(parseCategoryParam(btn.dataset.category ?? null));
    syncUrl();
    render();
  });
}
syncUrl();
render();
