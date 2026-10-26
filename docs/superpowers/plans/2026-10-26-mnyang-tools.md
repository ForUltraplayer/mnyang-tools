# mnyang-tools 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**목표:** 디바이스별로 거르고 검색할 수 있는 유틸리티 모음 정적 사이트를 Astro로 만들어 `https://forultraplayer.github.io/mnyang-tools/`에 배포한다.

**구조:** 항목 하나가 마크다운 파일 하나인 Astro content collection을 쓴다. 필터, 검색, Release 조회, 링크 규칙은 `src/lib/`의 순수 함수로 두고 Vitest로 검증한다. 화면은 빌드 결과물(`dist/`)을 HTML 파서로 읽는 테스트와 브라우저 확인으로 검증한다.

**기술 스택:** Astro 7.4.x, TypeScript, Vitest 5.x, node-html-parser 9.x(개발용), GitHub Actions(`withastro/action@v6`, `actions/deploy-pages@v5`). 로컬 Node 26.10.0에서 확인했다(Astro 요구 Node `>=22.23.4`).

**설계 문서:** `docs/superpowers/specs/2026-10-26-mnyang-tools-design.md`

## 용어표

| 표기 | 뜻 |
|---|---|
| 항목(item) | 사이트에 올리는 도구 하나. `src/content/items/<slug>.md` 파일 하나 |
| slug | 항목 파일 이름(확장자 제외). 상세 페이지 주소 `items/<slug>/`에 쓰인다 |
| 디바이스(`Device`) | `windows`, `android`, `web` |
| 출처(`Source`) | `mine`(직접 만듦), `modified`(수정판), `external`(외부) |
| 프로필 배지 | 출처가 `mine` 또는 `modified`인 항목에 붙는 작은 프로필 이미지 |
| base | 하위 경로 `/mnyang-tools` |

## 전역 제약

- `astro.config.mjs`: `site: 'https://forultraplayer.github.io'`, `base: '/mnyang-tools'`.
- 사이트 안의 모든 루트 상대 경로(`/`로 시작하는 `href`, `src`)는 `/mnyang-tools/`로 시작해야 한다.
- 화면 문구는 한국어다. 디바이스 표기는 `Windows`, `Android`, `웹`, 출처 표기는 `직접 만듦`, `수정판`, `외부`.
- 외부 CDN, 웹 글꼴, 외부 스크립트를 쓰지 않는다. 글꼴은 시스템 글꼴만 쓴다.
- 방문자 브라우저는 GitHub API를 호출하지 않는다. GitHub 정보는 빌드 때만 가져온다.
- 다른 사람의 파일을 저장소에 복사하지 않는다. 외부 항목은 링크만 둔다.
- 새로 만드는 소스 파일 상단에 그 언어의 주석으로 `@file`, `@author: ForUltraplayer`, `@brief`를 적는다(마크다운 항목 파일, JSON, lock 파일, 자동 생성 파일 제외).
- 저장소 루트는 `J:\Coding_project\Mnyang_github_io`, 기본 브랜치는 `main`. `.superpowers/`, `node_modules/`, `dist/`, `.astro/`, `public/avatar.png`는 `.gitignore`에 넣는다.
- 각 태스크 끝의 커밋은 로컬 커밋이다. GitHub 저장소 생성, push, Pages 설정은 태스크 10에서 사용자 승인을 받은 뒤에만 한다.

## 검토 초점

1. **base 경로 누락:** 링크나 이미지 경로 하나라도 `/mnyang-tools/` 없이 `/`로 시작하면 배포 후 깨진다. 태스크 1의 `dist` 테스트가 모든 HTML을 검사한다.
2. **검색 입력의 대소문자, 앞뒤 공백, 한글 부분 일치:** `" SPOTIFY "`와 `spotify`가 같게, `알림`이 요약 안의 부분 문자열로 걸려야 한다. 태스크 3에서 고정한다.
3. **주소의 잘못된 `device` 값:** `?device=mac`처럼 모르는 값이 오면 오류 없이 `전체`로 보여야 한다. 태스크 3에서 고정한다.
4. **저장소 없는 항목, Release 없는 항목:** Vencord(사이트만), SPOTIFY_PC(Release 없음)에서 버튼이 규칙대로 나와야 한다. 태스크 7의 `dist` 테스트에서 고정한다.
5. **GitHub API 한도 초과(403)나 네트워크 오류:** 로컬에서는 경고 후 빌드가 계속되고, CI에서는 빌드가 실패해야 한다. 태스크 4에서 고정한다.

---

### 태스크 1: 프로젝트 뼈대와 base 경로 검사

**파일:**
- 생성: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`
- 생성: `src/pages/index.astro`(임시 한 줄 페이지)
- 생성: `tests/dist.test.ts`

**인터페이스:**
- 제공: npm 스크립트 `dev`, `build`, `preview`, `test`(=`vitest run --exclude tests/dist.test.ts`), `test:dist`(=`vitest run tests/dist.test.ts`). 이후 태스크는 `tests/dist.test.ts`에 검사를 추가한다.
- 제공: `tests/dist.test.ts` 안의 헬퍼 `readDist(relPath: string): HTMLElement`(node-html-parser로 `dist/<relPath>`를 파싱), `allHtmlFiles(): string[]`.

- [ ] **1단계: 저장소와 패키지 준비**

```bash
git init -b main
npm init -y
npm install astro@^7.4.2
npm install -D vitest@^5.0.5 node-html-parser@^9.0.5 @astrojs/check typescript
```

`package.json`에 `"type": "module"`, `"private": true`와 위 스크립트를 넣는다. `vitest.config.ts`는 Astro 권장 방식대로 `getViteConfig`(`astro/config`)로 감싼다.

- [ ] **2단계: 실패하는 base 경로 테스트 작성** (`tests/dist.test.ts`)

```ts
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
```

`dist/`가 없으면 `beforeAll`에서 "먼저 npm run build" 메시지로 실패시킨다.

- [ ] **3단계: 설정 없이 빌드해 실패 확인**

`astro.config.mjs`에 `base` 없이, 임시 페이지에 `<link rel="icon" href="/favicon.svg">`를 둔 상태로 실행한다.
Run: `npm run build && npm run test:dist`
Expected: 첫 테스트 FAIL(`/favicon.svg`)

- [ ] **4단계: `astro.config.mjs`에 `site`, `base` 설정, 임시 페이지 경로를 `import.meta.env.BASE_URL` 기준으로 수정**

- [ ] **5단계: 통과 확인**

Run: `npm run build && npm run test:dist`
Expected: PASS 2개

- [ ] **6단계: 커밋**

```bash
git add -A
git commit -m "chore: scaffold Astro site with base path check"
```

---

### 태스크 2: 항목 스키마와 초기 항목 10개

**파일:**
- 생성: `src/lib/schema.ts`, `src/content.config.ts`
- 생성: `src/content/items/` 아래 10개 파일: `vencord.md`, `morphe.md`, `morphe-patches.md`, `pc-optimizer.md`, `notification-filter.md`, `notifications-pro-mnyang.md`, `spotify-pc.md`, `spotify-android.md`, `galaxy-book-enabler.md`, `shutter-sound-zero.md`
- 테스트: `tests/schema.test.ts`

**인터페이스:**
- 제공 (`src/lib/schema.ts`):
  - `DEVICES = ['windows', 'android', 'web'] as const`, `type Device`
  - `SOURCES = ['mine', 'modified', 'external'] as const`, `type Source`
  - `DEVICE_LABELS: Record<Device, string>` = `{ windows: 'Windows', android: 'Android', web: '웹' }`
  - `SOURCE_LABELS: Record<Source, string>` = `{ mine: '직접 만듦', modified: '수정판', external: '외부' }`
  - `itemSchema`(zod, `astro/zod`에서 import): `title: string(min 1)`, `summary: string(min 1)`, `devices: Device[](min 1)`, `source: Source`, `repo?: string`(`owner/name` 형식, 정규식 `^[\w.-]+\/[\w.-]+$`), `website?: url`, `download?: url`, `order: number`(기본값 100). `repo`와 `website`가 모두 없으면 거부.
  - `type ItemData = z.infer<typeof itemSchema>`
  - `isOwned(source: Source): boolean` — `mine`, `modified`이면 true
- 제공 (`src/content.config.ts`): 컬렉션 이름 `items`, `glob({ base: './src/content/items', pattern: '*.md' })`, `schema: itemSchema`.

- [ ] **1단계: 실패하는 테스트 작성** (`tests/schema.test.ts`)

```ts
const ok = { title: 'x', summary: 'y', devices: ['windows'], source: 'mine', repo: 'a/b' };
test('정상 항목을 받고 order 기본값을 채운다', () => {
  expect(itemSchema.parse(ok).order).toBe(100);
});
test('repo와 website가 모두 없으면 거부한다', () => {
  const { repo, ...noLink } = ok;
  expect(itemSchema.safeParse(noLink).success).toBe(false);
});
test('website만 있어도 받는다', () => {
  const { repo, ...rest } = ok;
  expect(itemSchema.safeParse({ ...rest, website: 'https://vencord.dev/' }).success).toBe(true);
});
test('모르는 디바이스, 빈 디바이스 목록, 잘못된 repo 형식을 거부한다', () => {
  expect(itemSchema.safeParse({ ...ok, devices: ['mac'] }).success).toBe(false);
  expect(itemSchema.safeParse({ ...ok, devices: [] }).success).toBe(false);
  expect(itemSchema.safeParse({ ...ok, repo: 'https://github.com/a/b' }).success).toBe(false);
});
test('isOwned는 mine과 modified만 true다', () => {
  expect(['mine', 'modified', 'external'].map((s) => isOwned(s as Source))).toEqual([true, true, false]);
});
```

- [ ] **2단계: 실패 확인** — Run: `npm test -- tests/schema.test.ts` / Expected: FAIL(모듈 없음)

- [ ] **3단계: `src/lib/schema.ts`, `src/content.config.ts` 구현**

- [ ] **4단계: 통과 확인** — Run: `npm test -- tests/schema.test.ts` / Expected: PASS

- [ ] **5단계: 항목 파일 10개 작성**

frontmatter 값은 아래 표를 그대로 쓴다. 본문은 pc-optimizer만 채우고 나머지는 비워 둔다.

| 파일 | title | summary | devices | source | repo / website |
|---|---|---|---|---|---|
| vencord.md | Vencord | Discord 클라이언트 모드 | windows, web | external | website `https://vencord.dev/` |
| morphe.md | Morphe | YouTube, YouTube Music, Reddit 앱 패치 도구 | android | external | website `https://morphe.software/` |
| morphe-patches.md | Morphe Patches | Morphe용 커뮤니티 패치 모음 | android | external | website `https://morphe-patches.software/` |
| pc-optimizer.md | pc_optimizer | Windows PC 진단, 정리, 최적화 도구 | windows | mine | repo `ForUltraplayer/pc_optimizer` |
| notification-filter.md | notification-filter | 키워드로 Android 알림 차단, 앱 예외와 차단 기록 | android | modified | repo `ForUltraplayer/notification-filter` |
| notifications-pro-mnyang.md | Notifications Pro (mnyang) | 한국어 UI와 앱별 알림음을 넣은 Notifications Pro 수정판 | windows | modified | repo `ForUltraplayer/Notifications_Pro_mnyang` |
| spotify-pc.md | SPOTIFY_PC | Spotify 가사 한글 발음 표시 패치 (Windows) | windows | modified | repo `ForUltraplayer/SPOTIFY_PC` |
| spotify-android.md | SPOTIFY_ANDROID | 한글 발음 표시를 넣은 Myspoti 수정판 | android | modified | repo `ForUltraplayer/SPOTIFY_ANDROID` |
| galaxy-book-enabler.md | GalaxyBookEnabler | 일반 Windows PC에서 갤럭시 북 기능(Quick Share 등) 사용 | windows | modified | repo `ForUltraplayer/GalaxyBookEnabler` |
| shutter-sound-zero.md | ShutterSoundZero | 카메라 셔터음 끄기 앱 | android | external | repo `hoons1994/ShutterSoundZero` |

pc-optimizer.md 본문은 저장소 README에서 확인된 사실만 쓴다: "## 설치 방법" 아래 "Release의 `PcOptimizer-v<버전>-win-x64.zip`을 받아 압축을 풀고 `PcOptimizer.exe`를 실행한다. 설치가 필요 없고, 관리자 권한 확인창에서 '예'를 누른다. 삭제는 폴더를 지우면 되고, 설정과 로그는 `%LocalAppData%\PcOptimizer`에 있다."

- [ ] **6단계: 빌드로 컬렉션 검증** — Run: `npm run build` / Expected: 오류 없이 완료(스키마 위반이 있으면 Astro가 파일 이름과 함께 실패)

- [ ] **7단계: 커밋** — `git commit -m "feat: add item schema and initial 10 items"`

---

### 태스크 3: 필터와 검색 로직

**파일:**
- 생성: `src/lib/filter.ts`
- 테스트: `tests/filter.test.ts`

**인터페이스:**
- 소비: `Device`, `DEVICES`(태스크 2)
- 제공:
  - `type DeviceFilter = Device | 'all'`
  - `interface Filterable { title: string; summary: string; devices: readonly Device[] }`
  - `normalizeText(s: string): string` — NFC 정규화, 소문자, 앞뒤 공백 제거, 연속 공백을 하나로
  - `matchesItem(item: Filterable, device: DeviceFilter, query: string): boolean` — 검색어를 공백으로 나눈 모든 조각이 `title + ' ' + summary` 안에 있어야 한다(AND). 빈 검색어는 모두 일치.
  - `countByDevice(items: readonly Filterable[], query: string): Record<DeviceFilter, number>` — 현재 검색어를 적용한 개수
  - `parseDeviceParam(value: string | null): DeviceFilter` — 모르는 값과 null은 `'all'`
  - `sortItems<T extends { title: string; order: number }>(items: T[]): T[]` — `order` 오름차순, 같으면 `title`을 `localeCompare(…, 'ko')`로

- [ ] **1단계: 실패하는 테스트 작성** (`tests/filter.test.ts`)

```ts
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
```

- [ ] **2단계: 실패 확인** — Run: `npm test -- tests/filter.test.ts` / Expected: FAIL

- [ ] **3단계: `src/lib/filter.ts` 구현**

- [ ] **4단계: 통과 확인** — Expected: PASS 7개

- [ ] **5단계: 커밋** — `git commit -m "feat: add device filter and search logic"`

---

### 태스크 4: GitHub Release 조회와 링크 규칙

**파일:**
- 생성: `src/lib/github.ts`, `src/lib/links.ts`
- 테스트: `tests/github.test.ts`, `tests/links.test.ts`

**인터페이스:**
- 제공 (`src/lib/github.ts`):
  - `type ReleaseInfo = { status: 'found'; tag: string } | { status: 'none' } | { status: 'unknown' }`
  - `interface ReleaseOptions { token?: string; ci: boolean; fetchImpl?: typeof fetch; warn?: (msg: string) => void }`
  - `releaseOptionsFromEnv(env: Record<string, string | undefined>): ReleaseOptions` — `token = env.GITHUB_TOKEN`, `ci = env.CI === 'true' || env.CI === '1'`
  - `fetchLatestRelease(repo: string, opts: ReleaseOptions): Promise<ReleaseInfo>` — `GET https://api.github.com/repos/${repo}/releases/latest`, 헤더 `Accept: application/vnd.github+json`, `User-Agent: mnyang-tools`, 토큰이 있으면 `Authorization: Bearer <token>`. 200이면 `found`(`tag_name`), 404면 `none`, 그 밖의 상태 코드나 예외는 `ci`면 `Error`를 던지고(메시지에 repo와 상태 포함, 토큰은 넣지 않음) 아니면 `warn` 호출 후 `unknown`.
  - `fetchReleases(repos: string[], opts: ReleaseOptions): Promise<Map<string, ReleaseInfo>>` — 중복 제거 후 병렬 조회
- 제공 (`src/lib/links.ts`):
  - `githubRepoUrl(repo: string): string` → `https://github.com/${repo}`
  - `resolveDownload(item: { download?: string; repo?: string }, release: ReleaseInfo | undefined): string | null` — `download`가 있으면 그 값, 없고 `release?.status === 'found'`이면 `https://github.com/${repo}/releases/latest`, 아니면 `null`
  - `withBase(path: string, base: string = import.meta.env.BASE_URL): string` — base와 path 사이 슬래시를 하나로 맞춘다. `withBase('items/vencord/', '/mnyang-tools')` → `/mnyang-tools/items/vencord/`, `withBase('', '/mnyang-tools/')` → `/mnyang-tools/`

- [ ] **1단계: 실패하는 테스트 작성**

`tests/github.test.ts` — 가짜 `fetchImpl`로 상태 코드를 흉내 낸다.

```ts
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
test('releaseOptionsFromEnv는 CI 값을 해석한다', () => {
  expect(releaseOptionsFromEnv({ CI: 'true', GITHUB_TOKEN: 't' })).toMatchObject({ ci: true, token: 't' });
  expect(releaseOptionsFromEnv({})).toMatchObject({ ci: false });
});
```

`tests/links.test.ts`

```ts
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
```

- [ ] **2단계: 실패 확인** — Run: `npm test -- tests/github.test.ts tests/links.test.ts` / Expected: FAIL

- [ ] **3단계: 두 모듈 구현**

- [ ] **4단계: 통과 확인** — Expected: PASS 10개

- [ ] **5단계: 커밋** — `git commit -m "feat: add build-time release lookup and link rules"`

---

### 태스크 5: 프로필 이미지 준비 스크립트

**파일:**
- 생성: `scripts/prepare-avatar.mjs`
- 수정: `package.json`(스크립트 `prebuild`, `predev` = `node scripts/prepare-avatar.mjs`)
- 테스트: `tests/prepare-avatar.test.ts`

**인터페이스:**
- 제공: `export async function prepareAvatar({ fetchImpl, outFile, ci, log }): Promise<'downloaded' | 'kept' | 'missing'>`
  - 주소: `https://github.com/ForUltraplayer.png?size=96`(리다이렉트를 따라간다)
  - 성공(200, `content-type`이 `image/`로 시작)이면 `outFile`에 쓰고 `'downloaded'`
  - 실패 시 `ci`면 `Error`를 던진다
  - 실패 시 로컬이면 `outFile`이 이미 있으면 `'kept'`, 없으면 `'missing'`, 둘 다 `log`로 경고
- 제공: 직접 실행하면 `outFile = public/avatar.png`, `ci = process.env.CI === 'true' || '1'`로 호출하고, 던져진 오류면 종료 코드 1
- 소비하는 쪽(태스크 6 헤더)은 `withBase('avatar.png')`를 `<img>`로 쓰고, 파일이 없으면 `onerror`로 이미지를 숨겨 배경 원만 남긴다.

- [ ] **1단계: 실패하는 테스트 작성** — 임시 폴더(`fs.mkdtemp`)를 `outFile` 위치로 쓴다.

```ts
test('이미지 응답이면 파일을 쓴다', async () => { /* 200 + image/png → 'downloaded', 파일 바이트 일치 */ });
test('CI에서 실패하면 던진다', async () => { /* 500, ci:true → rejects */ });
test('로컬 실패, 기존 파일 있음이면 kept이고 파일을 건드리지 않는다', async () => { /* 기존 내용 유지 */ });
test('로컬 실패, 파일 없음이면 missing', async () => { /* 파일 생성 안 됨 */ });
test('image가 아닌 content-type은 실패로 본다', async () => { /* 200 + text/html, ci:true → rejects */ });
```

- [ ] **2단계: 실패 확인** — Run: `npm test -- tests/prepare-avatar.test.ts` / Expected: FAIL

- [ ] **3단계: 구현** — Node 내장 `fetch`와 `fs/promises`만 쓴다.

- [ ] **4단계: 통과 확인** — Expected: PASS 5개. 이어서 `npm run build` 후 `public/avatar.png`가 생겼는지 확인한다.

- [ ] **5단계: 커밋** — `git commit -m "feat: download GitHub avatar at build time"`

---

### 태스크 6: 목록 화면

**파일:**
- 생성: `src/lib/site.ts`, `src/styles/global.css`, `src/layouts/Base.astro`, `src/components/OwnerBadge.astro`, `src/components/ItemCard.astro`, `src/scripts/list-filter.ts`
- 수정: `src/pages/index.astro`(임시 페이지 교체)
- 수정: `tests/dist.test.ts`

**인터페이스:**
- 소비: `itemSchema` 관련 타입·라벨·`isOwned`(태스크 2), `matchesItem`, `countByDevice`, `parseDeviceParam`, `sortItems`(태스크 3), `withBase`(태스크 4)
- 제공 (`src/lib/site.ts`): `SITE = { name: 'mnyang-tools', owner: 'ForUltraplayer', profileUrl: 'https://github.com/ForUltraplayer' } as const`
- 제공 (`Base.astro`): props `{ title: string; description?: string }`. `<html lang="ko">`, 헤더(프로필 이미지 + `mnyang-tools` + `· ForUltraplayer`, 프로필 영역은 `SITE.profileUrl`로 연결, 사이트 이름은 `withBase('')`로 연결), `<slot />`.
- 제공 (`ItemCard.astro`): props `{ slug: string; data: ItemData }`. 루트 `<a class="card" data-item href={withBase(`items/${slug}/`)} data-devices="windows web" data-title data-summary>`. 카드 안에 제목, 출처가 소유면 `OwnerBadge`, 요약, 디바이스 칩.
- 제공 (`OwnerBadge.astro`): `<img class="owner-badge" src={withBase('avatar.png')} alt="ForUltraplayer" width="16" height="16">`
- DOM 계약 (`index.astro` ↔ `list-filter.ts`):
  - 검색창 `input#search[type=search]`, placeholder `이름이나 설명으로 검색`
  - 탭 `button.tab[data-device]` 4개(`all`, `windows`, `android`, `web`), 안에 `span[data-count]`, 선택된 탭은 `aria-pressed="true"`
  - 카드 목록 `#items`, 결과 없음 문구 `p#empty`(`검색 결과가 없습니다`, 기본 `hidden`)
- `list-filter.ts`: 카드의 data 속성에서 `Filterable`을 만들고, 입력과 탭 클릭마다 카드 `hidden` 토글, 개수 갱신, `#empty` 토글, 주소의 `?device=` 값을 `history.replaceState`로 맞춘다(`all`이면 파라미터 제거). 처음 로드 때 `parseDeviceParam(new URLSearchParams(location.search).get('device'))`로 탭을 고른다.
- 스타일: 시스템 글꼴, CSS 변수로 밝은/어두운 테마(`prefers-color-scheme`), 강조색은 시안의 밝은 파랑 계열. 카드 그리드는 넓은 화면에서 `repeat(auto-fill, minmax(260px, 1fr))`, 600px 미만에서 한 줄에 하나. 탭 줄은 좁은 화면에서 가로 스크롤.

- [ ] **1단계: 실패하는 `dist` 테스트 추가**

```ts
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
```

- [ ] **2단계: 실패 확인** — Run: `npm run build && npm run test:dist` / Expected: 새 테스트 FAIL

- [ ] **3단계: 위 파일들 구현**

- [ ] **4단계: 통과 확인** — Expected: `npm test`, `npm run test:dist` 모두 PASS

- [ ] **5단계: 브라우저 확인**

`npm run preview`로 띄운 뒤(주소는 `http://localhost:4321/mnyang-tools/`) 다음을 확인한다.
- Android 탭 → 카드 5개, 주소에 `?device=android`
- 검색 `알림` → 카드 2개(notification-filter, Notifications Pro), 탭 개수가 `전체 2`, `Windows 1`, `Android 1`, `웹 0`으로 바뀜
- 검색 `zzz` → `검색 결과가 없습니다` 표시
- `?device=mac`으로 직접 열기 → 전체 탭, 오류 없음
- 폭 375px에서 카드 한 줄에 하나, 가로 스크롤 없음(탭 줄 제외)
- 어두운 테마에서 글자가 읽힘

확인 후 미리보기 서버를 끈다.

- [ ] **6단계: 커밋** — `git commit -m "feat: add list page with search and device tabs"`

---

### 태스크 7: 상세 페이지

**파일:**
- 생성: `src/pages/items/[slug].astro`
- 수정: `src/styles/global.css`(상세 페이지 스타일)
- 수정: `tests/dist.test.ts`

**인터페이스:**
- 소비: `fetchReleases`, `releaseOptionsFromEnv`(태스크 4), `resolveDownload`, `githubRepoUrl`, `withBase`(태스크 4), 라벨과 `isOwned`(태스크 2), `Base.astro`, `OwnerBadge.astro`(태스크 6)
- `getStaticPaths`: `getCollection('items')`, 저장소가 있는 항목의 `repo`만 모아 `fetchReleases(repos, { ...releaseOptionsFromEnv(process.env), warn: console.warn })`를 **한 번만** 호출하고, 각 경로에 `{ entry, release }`를 props로 넘긴다.
- 페이지 구성(위에서 아래로):
  - `← 목록` 링크(`withBase('')`)
  - 제목 + 소유면 `OwnerBadge`, 요약
  - 칩: 디바이스 라벨들, 출처 라벨, `release.status === 'found'`면 태그
  - 버튼: 받기 `a[data-action="download"]`(`resolveDownload` 결과가 있을 때만), GitHub 저장소 `a[data-action="repo"]`(`repo`가 있을 때), 사이트 `a[data-action="website"]`(`website`가 있을 때). 외부 링크는 `rel="noopener"`.
  - 본문: `render(entry)`의 `<Content />`. 본문이 비어 있으면 `아직 작성된 사용법이 없습니다.` 문구를 보여 준다(설계자 판단).
  - `<title>`은 `<항목 제목> · mnyang-tools`

- [ ] **1단계: 실패하는 `dist` 테스트 추가** (네트워크가 되는 환경에서 빌드한다는 전제)

```ts
const slugs = ['vencord', 'morphe', 'morphe-patches', 'pc-optimizer', 'notification-filter',
  'notifications-pro-mnyang', 'spotify-pc', 'spotify-android', 'galaxy-book-enabler', 'shutter-sound-zero'];

test('항목마다 상세 페이지가 있다', () => {
  for (const s of slugs) expect(() => readDist(`items/${s}/index.html`)).not.toThrow();
});
test('Release가 있는 내 저장소는 받기 버튼이 releases/latest로 간다', () => {
  const a = readDist('items/pc-optimizer/index.html').querySelector('a[data-action="download"]');
  expect(a?.getAttribute('href')).toBe('https://github.com/ForUltraplayer/pc_optimizer/releases/latest');
});
test('Release가 없으면 받기 버튼 없이 저장소 링크만 있다', () => {
  const root = readDist('items/spotify-pc/index.html');
  expect(root.querySelector('a[data-action="download"]')).toBeNull();
  expect(root.querySelector('a[data-action="repo"]')?.getAttribute('href')).toBe('https://github.com/ForUltraplayer/SPOTIFY_PC');
});
test('사이트만 있는 외부 항목은 사이트 버튼만 있다', () => {
  const root = readDist('items/vencord/index.html');
  expect(root.querySelector('a[data-action="website"]')?.getAttribute('href')).toBe('https://vencord.dev/');
  expect(root.querySelector('a[data-action="repo"]')).toBeNull();
  expect(root.querySelector('a[data-action="download"]')).toBeNull();
});
test('본문이 빈 항목은 안내 문구를 보여 준다', () => {
  expect(readDist('items/morphe/index.html').text).toContain('아직 작성된 사용법이 없습니다');
  expect(readDist('items/pc-optimizer/index.html').text).not.toContain('아직 작성된 사용법이 없습니다');
});
```

- [ ] **2단계: 실패 확인** — Run: `npm run build && npm run test:dist` / Expected: 새 테스트 FAIL

- [ ] **3단계: `src/pages/items/[slug].astro` 구현**

- [ ] **4단계: 통과 확인** — Expected: `npm test`, `npm run test:dist` 모두 PASS(태스크 1의 base 경로 검사도 새 페이지까지 포함해 통과)

- [ ] **5단계: 실패 정책 확인** — Bash에서 잘못된 토큰으로 두 번 빌드한다.
  - `GITHUB_TOKEN=invalid npm run build` → 401 경고가 찍히고 빌드 성공, 상세 페이지에 받기 버튼과 버전 칩이 없음
  - `CI=true GITHUB_TOKEN=invalid npm run build` → 빌드 실패, 오류 메시지에 repo 이름과 401이 있고 토큰 값은 없음
  - 확인 뒤 토큰 없이 다시 `npm run build`로 정상 결과물을 만든다.

- [ ] **6단계: 커밋** — `git commit -m "feat: add item detail page"`

---

### 태스크 8: GitHub Pages 배포 워크플로

**파일:**
- 생성: `.github/workflows/deploy.yml`

**인터페이스:**
- `on`: `push`(`main`), `workflow_dispatch`. 예약 실행은 넣지 않는다.
- `permissions`: `contents: read`, `pages: write`, `id-token: write`
- build 잡: `actions/checkout@v7` → `withastro/action@v6`, 이 스텝에 `env: GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}`. GitHub Actions가 `CI=true`를 자동으로 넣으므로 Release 조회 실패와 프로필 이미지 실패는 빌드 실패가 된다. `npm run build`가 `prebuild`를 함께 실행하는지 확인한다(`withastro/action`은 lock 파일로 패키지 관리자를 고르므로 `package-lock.json`을 커밋한다).
- deploy 잡: `actions/deploy-pages@v5`, `environment: github-pages`
- Node 버전: Astro 7.4가 Node `>=22.23.4`를 요구하므로 `withastro/action`에 `node-version: 24`를 지정한다. 테스트 스텝용으로 `actions/setup-node`(작성 시점 최신 메이저, `node-version: 24`)를 둔다. 정확한 입력 이름과 메이저 버전은 각 action의 README에서 확인한다.
- 테스트 실행은 build 잡에서 `withastro/action` 앞에 `npm ci && npm test`로 넣는다(설계자 판단: 순수 함수 테스트만, 네트워크 불필요).

- [ ] **1단계: 워크플로 작성**

- [ ] **2단계: 점검** — Astro 공식 GitHub Pages 문서(`docs.astro.build/en/guides/deploy/github/`)의 예시와 action 이름, 버전, 권한을 대조한다. 로컬에서 실행할 수 없으므로 실제 동작은 태스크 10에서 확인한다.

- [ ] **3단계: 커밋** — `git commit -m "ci: deploy to GitHub Pages"`

---

### 태스크 9: 최종 로컬 확인

- [ ] **1단계:** `npm ci && npm test && npm run build && npm run test:dist` 전체 통과
- [ ] **2단계:** `npx astro check` 오류 0개
- [ ] **3단계:** `npm run preview`로 띄워 Browser pane에서 확인
  - 목록 → 카드 클릭 → 상세 → `← 목록`으로 돌아오기
  - 상세 페이지의 받기, 저장소, 사이트 버튼이 태스크 7 규칙대로 나오는지 10개 모두 훑기
  - 페이지를 열 때 네트워크 요청이 모두 `localhost`로만 가는지(외부 링크를 누른 경우는 제외)
  - 폭 375px과 데스크톱 폭, 밝은/어두운 테마
- [ ] **4단계:** 미리보기 서버와 브레인스토밍 미리보기 서버를 모두 끈다(`.superpowers/` 서버는 `stop-server.sh`로). 끈 뒤 남은 프로세스가 없는지 확인한다.
- [ ] **5단계:** 결과를 사용자에게 보고하고 태스크 10 진행 승인을 받는다.

---

### 태스크 10: 공개 배포 (사용자 승인 후에만)

외부 공개 작업이다. 태스크 9 보고 뒤 사용자가 명시적으로 승인한 경우에만 진행한다.

- [ ] **1단계:** `gh repo create ForUltraplayer/mnyang-tools --public --source . --remote origin`
- [ ] **2단계:** Pages 소스를 GitHub Actions로 설정: `gh api -X POST repos/ForUltraplayer/mnyang-tools/pages -f build_type=workflow`
- [ ] **3단계:** `git push -u origin main`
- [ ] **4단계:** `gh run watch`로 워크플로 완료 확인. 실패하면 로그 원문을 사용자에게 보여 주고 원인을 고친다.
- [ ] **5단계:** `https://forultraplayer.github.io/mnyang-tools/`를 Browser pane으로 열어 목록, 상세, 프로필 이미지, 받기 버튼을 확인한다.
