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

test('dist에 HTML 파일이 하나 이상 있다', () => {
  expect(allHtmlFiles().length).toBeGreaterThan(0);
});

test('목록 화면에 항목 10개와 탭 개수가 맞게 나온다', () => {
  const root = readDist('index.html');
  expect(root.querySelectorAll('[data-item]')).toHaveLength(10);
  const count = (d: string) => root.querySelector(`button.tab[data-device="${d}"] [data-count]`)!.text.trim();
  expect([count('all'), count('windows'), count('android'), count('web')]).toEqual(['10', '5', '5', '1']);
});

test('프로필 배지는 직접 만듦과 수정판 6개에만 붙는다', () => {
  expect(readDist('index.html').querySelectorAll('[data-item] .owner-badge')).toHaveLength(6);
});

test('검색창과 결과 없음 문구가 있다', () => {
  const root = readDist('index.html');
  expect(root.querySelector('input#search')).not.toBeNull();
  expect(root.querySelector('p#empty')?.text).toContain('검색 결과가 없습니다');
});
