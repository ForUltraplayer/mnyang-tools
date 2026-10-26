/**
 * @file list-filter.ts
 * @author: ForUltraplayer
 * @brief 목록 화면 클라이언트 필터: 탭, 검색, 개수 갱신, ?device= 동기화
 */
import { DEVICES, type Device } from '../lib/devices';
import { countByDevice, matchesItem, parseDeviceParam, type DeviceFilter, type Filterable } from '../lib/filter';

const search = document.querySelector<HTMLInputElement>('#search');
const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('button.tab[data-device]'));
const empty = document.querySelector<HTMLElement>('#empty');
const cards = Array.from(document.querySelectorAll<HTMLElement>('#items [data-item]'));

const entries = cards.map((el) => {
  const item: Filterable = {
    title: el.dataset.title ?? '',
    summary: el.dataset.summary ?? '',
    devices: (el.dataset.devices ?? '')
      .split(' ')
      .filter((d): d is Device => (DEVICES as readonly string[]).includes(d)),
  };
  return { el, item };
});

let device: DeviceFilter = parseDeviceParam(new URLSearchParams(location.search).get('device'));

function render(): void {
  const query = search?.value ?? '';
  let visible = 0;
  for (const { el, item } of entries) {
    const show = matchesItem(item, device, query);
    el.hidden = !show;
    if (show) visible++;
  }
  if (empty) empty.hidden = visible > 0;

  const counts = countByDevice(
    entries.map((e) => e.item),
    query,
  );
  for (const tab of tabs) {
    const key = tab.dataset.device as DeviceFilter;
    tab.setAttribute('aria-pressed', String(key === device));
    const badge = tab.querySelector('[data-count]');
    if (badge) badge.textContent = String(counts[key]);
  }
}

function syncUrl(): void {
  const url = new URL(location.href);
  if (device === 'all') url.searchParams.delete('device');
  else url.searchParams.set('device', device);
  history.replaceState(null, '', url);
}

search?.addEventListener('input', render);
for (const tab of tabs) {
  tab.addEventListener('click', () => {
    device = parseDeviceParam(tab.dataset.device ?? null);
    syncUrl();
    render();
  });
}
render();
