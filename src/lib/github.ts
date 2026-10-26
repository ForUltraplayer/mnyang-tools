/**
 * @file github.ts
 * @author: ForUltraplayer
 * @brief 빌드 때 GitHub 최신 Release를 조회한다(CI 실패, 로컬 경고)
 */
export type ReleaseInfo =
  | { status: 'found'; tag: string }
  | { status: 'none' }
  | { status: 'unknown' };

export interface ReleaseOptions {
  token?: string;
  ci: boolean;
  fetchImpl?: typeof fetch;
  warn?: (msg: string) => void;
}

export function releaseOptionsFromEnv(env: Record<string, string | undefined>): ReleaseOptions {
  return { token: env.GITHUB_TOKEN, ci: env.CI === 'true' || env.CI === '1' };
}

export async function fetchLatestRelease(repo: string, opts: ReleaseOptions): Promise<ReleaseInfo> {
  const doFetch = opts.fetchImpl ?? fetch;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'mnyang-tools',
  };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  let reason: string;
  try {
    const response = await doFetch(`https://api.github.com/repos/${repo}/releases/latest`, { headers });
    if (response.status === 200) {
      const body = (await response.json()) as { tag_name?: unknown };
      if (typeof body.tag_name === 'string' && body.tag_name) {
        return { status: 'found', tag: body.tag_name };
      }
      reason = '응답에 tag_name이 없음';
    } else if (response.status === 404) {
      return { status: 'none' };
    } else {
      reason = `상태 ${response.status}`;
    }
  } catch (e) {
    // 토큰이 메시지에 섞이지 않도록 오류 종류만 남긴다.
    reason = `요청 실패(${e instanceof Error ? e.name : 'unknown'})`;
  }

  const message = `${repo} Release 조회 실패: ${reason}`;
  if (opts.ci) throw new Error(message);
  (opts.warn ?? console.warn)(message);
  return { status: 'unknown' };
}

export async function fetchReleases(repos: string[], opts: ReleaseOptions): Promise<Map<string, ReleaseInfo>> {
  const unique = [...new Set(repos)];
  const results = await Promise.all(unique.map((repo) => fetchLatestRelease(repo, opts)));
  return new Map(unique.map((repo, i) => [repo, results[i]]));
}
