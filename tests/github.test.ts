/**
 * @file github.test.ts
 * @author: ForUltraplayer
 * @brief GitHub Release 조회 모듈의 상태 코드·실패 정책 테스트
 */
import { expect, test, vi } from 'vitest';
import { fetchLatestRelease, releaseOptionsFromEnv } from '../src/lib/github';

const res = (status: number, body: unknown = {}) => async () => new Response(JSON.stringify(body), { status });

test('200이면 태그를 돌려준다', async () => {
  expect(await fetchLatestRelease('a/b', { ci: true, fetchImpl: res(200, { tag_name: 'v0.2.2' }) }))
    .toEqual({ status: 'found', tag: 'v0.2.2' });
});
test('404는 Release 없음이며 CI에서도 실패가 아니다', async () => {
  expect(await fetchLatestRelease('a/b', { ci: true, fetchImpl: res(404) })).toEqual({ status: 'none' });
});
test('CI에서 403이면 repo와 상태 코드를 담아 던진다', async () => {
  await expect(fetchLatestRelease('a/b', { ci: true, fetchImpl: res(403) })).rejects.toThrow(/a\/b.*403/);
});
test('로컬에서 네트워크 오류면 경고하고 unknown', async () => {
  const warn = vi.fn();
  const r = await fetchLatestRelease('a/b', { ci: false, warn, fetchImpl: async () => { throw new TypeError('fetch failed'); } });
  expect(r).toEqual({ status: 'unknown' });
  expect(warn).toHaveBeenCalledOnce();
});
test('토큰이 있으면 Authorization 헤더를 보내고 오류 메시지에는 넣지 않는다', async () => {
  const seen: Headers[] = [];
  const fetchImpl = async (_u: string, init?: RequestInit) => { seen.push(new Headers(init?.headers)); return new Response('', { status: 500 }); };
  const err = await fetchLatestRelease('a/b', { ci: true, token: 'secret123', fetchImpl: fetchImpl as typeof fetch })
    .catch((e: Error) => e);
  expect(err).toBeInstanceOf(Error);
  expect((err as Error).message).not.toContain('secret123');
  expect(seen[0].get('authorization')).toBe('Bearer secret123');
});
test('릴리스 요청에 AbortSignal(타임아웃)을 전달한다', async () => {
  let signal: unknown;
  const fetchImpl = async (_u: string, init?: RequestInit) => { signal = init?.signal; return new Response('{}', { status: 404 }); };
  await fetchLatestRelease('a/b', { ci: true, fetchImpl: fetchImpl as typeof fetch });
  expect(signal).toBeInstanceOf(AbortSignal);
});
test('타임아웃(TimeoutError)은 CI에서 repo와 이유를 담아 던지고 로컬에서는 unknown', async () => {
  const boom = async () => { throw new DOMException('timed out', 'TimeoutError'); };
  await expect(fetchLatestRelease('a/b', { ci: true, fetchImpl: boom as typeof fetch })).rejects.toThrow(/a\/b.*TimeoutError/);
  const warn = vi.fn();
  expect(await fetchLatestRelease('a/b', { ci: false, warn, fetchImpl: boom as typeof fetch })).toEqual({ status: 'unknown' });
});
test('releaseOptionsFromEnv는 CI 값을 해석한다', () => {
  expect(releaseOptionsFromEnv({ CI: 'true', GITHUB_TOKEN: 't' })).toMatchObject({ ci: true, token: 't' });
  expect(releaseOptionsFromEnv({})).toMatchObject({ ci: false });
});
