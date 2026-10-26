/**
 * @file links.test.ts
 * @author: ForUltraplayer
 * @brief 다운로드 링크 결정과 base 경로 결합 테스트
 */
import { expect, test } from 'vitest';
import { resolveDownload, withBase } from '../src/lib/links';

test('download가 있으면 Release와 상관없이 그 주소다', () => {
  expect(resolveDownload({ download: 'https://x.dev/a.zip', repo: 'a/b' }, { status: 'none' })).toBe('https://x.dev/a.zip');
});
test('Release가 있으면 releases/latest로 연결한다', () => {
  expect(resolveDownload({ repo: 'a/b' }, { status: 'found', tag: 'v1' })).toBe('https://github.com/a/b/releases/latest');
});
test('Release 없음, 알 수 없음, repo 없음이면 null', () => {
  expect(resolveDownload({ repo: 'a/b' }, { status: 'none' })).toBeNull();
  expect(resolveDownload({ repo: 'a/b' }, { status: 'unknown' })).toBeNull();
  expect(resolveDownload({}, undefined)).toBeNull();
});
test('withBase는 슬래시를 하나로 맞춘다', () => {
  expect(withBase('items/vencord/', '/mnyang-tools')).toBe('/mnyang-tools/items/vencord/');
  expect(withBase('/avatar.png', '/mnyang-tools/')).toBe('/mnyang-tools/avatar.png');
  expect(withBase('', '/mnyang-tools/')).toBe('/mnyang-tools/');
});
