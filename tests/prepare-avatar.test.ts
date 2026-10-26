/**
 * @file prepare-avatar.test.ts
 * @author: ForUltraplayer
 * @brief prepareAvatar 단위 테스트(다운로드, CI 실패, 로컬 폴백)
 */
import { afterEach, beforeEach, expect, test } from 'vitest';
import { mkdtemp, readFile, rm, writeFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// @ts-expect-error 타입 선언이 없는 .mjs 스크립트
import { prepareAvatar } from '../scripts/prepare-avatar.mjs';

let dir: string;
let outFile: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'avatar-'));
  outFile = join(dir, 'avatar.png');
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const exists = (p: string) => access(p).then(() => true, () => false);
const respond = (status: number, type: string, body: Uint8Array = new Uint8Array([1, 2, 3])) =>
  (async () => new Response(body, { status, headers: { 'content-type': type } })) as unknown as typeof fetch;

test('이미지 응답이면 파일을 쓴다', async () => {
  const bytes = new Uint8Array([137, 80, 78, 71, 9, 8]);
  const result = await prepareAvatar({ fetchImpl: respond(200, 'image/png', bytes), outFile, ci: false, log: () => {} });
  expect(result).toBe('downloaded');
  expect(new Uint8Array(await readFile(outFile))).toEqual(bytes);
});

test('CI에서 실패하면 던진다', async () => {
  await expect(
    prepareAvatar({ fetchImpl: respond(500, 'text/plain'), outFile, ci: true, log: () => {} }),
  ).rejects.toThrow();
  expect(await exists(outFile)).toBe(false);
});

test('로컬 실패, 기존 파일 있음이면 kept이고 파일을 건드리지 않는다', async () => {
  await writeFile(outFile, 'old');
  const logs: string[] = [];
  const result = await prepareAvatar({ fetchImpl: respond(500, 'text/plain'), outFile, ci: false, log: (m: string) => logs.push(m) });
  expect(result).toBe('kept');
  expect(await readFile(outFile, 'utf8')).toBe('old');
  expect(logs.length).toBe(1);
});

test('로컬 실패, 파일 없음이면 missing', async () => {
  const logs: string[] = [];
  const failing = (async () => { throw new TypeError('network'); }) as unknown as typeof fetch;
  const result = await prepareAvatar({ fetchImpl: failing, outFile, ci: false, log: (m: string) => logs.push(m) });
  expect(result).toBe('missing');
  expect(await exists(outFile)).toBe(false);
  expect(logs.length).toBe(1);
});

test('image가 아닌 content-type은 실패로 본다', async () => {
  await expect(
    prepareAvatar({ fetchImpl: respond(200, 'text/html'), outFile, ci: true, log: () => {} }),
  ).rejects.toThrow();
  expect(await exists(outFile)).toBe(false);
});
