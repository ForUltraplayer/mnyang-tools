/**
 * @file dist.test.ts
 * @author: ForUltraplayer
 * @brief 빌드 결과(dist) 검사: base 경로, 외부 자원 미사용
 */
import { beforeAll, expect, test } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse, type HTMLElement } from 'node-html-parser';

const DIST = join(process.cwd(), 'dist');

export function allHtmlFiles(dir = DIST, prefix = ''): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? allHtmlFiles(join(dir, e.name), `${prefix}${e.name}/`)
      : e.name.endsWith('.html')
        ? [`${prefix}${e.name}`]
        : [],
  );
}

export function readDist(relPath: string): HTMLElement {
  return parse(readFileSync(join(DIST, relPath), 'utf-8'));
}

beforeAll(() => {
  if (!existsSync(DIST)) throw new Error('dist/가 없습니다. 먼저 npm run build를 실행하세요.');
});

test('모든 HTML의 루트 상대 경로가 base로 시작한다', () => {
  for (const file of allHtmlFiles()) {
    const root = readDist(file);
    for (const el of root.querySelectorAll('[href],[src]')) {
      const url = el.getAttribute('href') ?? el.getAttribute('src')!;
      if (url.startsWith('/')) expect(url, `${file}: ${url}`).toMatch(/^\/mnyang-tools\//);
    }
  }
});

test('외부 스크립트와 외부 스타일시트를 불러오지 않는다', () => {
  for (const file of allHtmlFiles()) {
    const root = readDist(file);
    for (const s of root.querySelectorAll('script[src]')) expect(s.getAttribute('src')).not.toMatch(/^https?:/);
    for (const l of root.querySelectorAll('link[rel="stylesheet"]')) expect(l.getAttribute('href')).not.toMatch(/^https?:/);
  }
});
