/**
 * @file filter.test.ts
 * @author: ForUltraplayer
 * @brief 필터·검색 로직 단위 테스트
 */
import { expect, test } from 'vitest';
import { countByDevice, matchesItem, parseDeviceParam, sortItems } from '../src/lib/filter';

const items = [
  { title: 'SPOTIFY_PC', summary: 'Spotify 가사 한글 발음 표시 패치 (Windows)', devices: ['windows'] },
  { title: 'notification-filter', summary: '키워드로 Android 알림 차단', devices: ['android'] },
  { title: 'Vencord', summary: 'Discord 클라이언트 모드', devices: ['windows', 'web'] },
] as const;

test('대소문자와 앞뒤 공백을 무시한다', () => {
  expect(matchesItem(items[0], 'all', '  spotify ')).toBe(true);
});
test('한글 부분 문자열로 요약을 찾는다', () => {
  expect(items.filter((i) => matchesItem(i, 'all', '알림')).map((i) => i.title)).toEqual(['notification-filter']);
});
test('여러 단어는 모두 포함해야 한다', () => {
  expect(matchesItem(items[0], 'all', 'spotify 발음')).toBe(true);
  expect(matchesItem(items[0], 'all', 'spotify discord')).toBe(false);
});
test('디바이스와 검색어를 함께 적용한다', () => {
  expect(matchesItem(items[2], 'web', 'discord')).toBe(true);
  expect(matchesItem(items[2], 'android', 'discord')).toBe(false);
});
test('countByDevice는 검색어를 반영하고 여러 디바이스 항목을 각 탭에 센다', () => {
  expect(countByDevice(items, '')).toEqual({ all: 3, windows: 2, android: 1, web: 1 });
  expect(countByDevice(items, 'discord')).toEqual({ all: 1, windows: 1, android: 0, web: 1 });
});
test('모르는 device 값은 all이 된다', () => {
  expect(parseDeviceParam('mac')).toBe('all');
  expect(parseDeviceParam(null)).toBe('all');
  expect(parseDeviceParam('android')).toBe('android');
});
test('sortItems는 order, 그다음 제목 순이다', () => {
  const r = sortItems([{ title: '나', order: 100 }, { title: '가', order: 100 }, { title: '다', order: 1 }]);
  expect(r.map((i) => i.title)).toEqual(['다', '가', '나']);
});
