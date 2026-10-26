/**
 * @file links.ts
 * @author: ForUltraplayer
 * @brief GitHub·다운로드 링크 규칙과 base 경로 결합(브라우저 안전)
 */
import type { ReleaseInfo } from './github';

export function githubRepoUrl(repo: string): string {
  return `https://github.com/${repo}`;
}

export function resolveDownload(
  item: { download?: string; repo?: string },
  release: ReleaseInfo | undefined,
): string | null {
  if (item.download) return item.download;
  if (item.repo && release?.status === 'found') return `${githubRepoUrl(item.repo)}/releases/latest`;
  return null;
}

export function withBase(path: string, base: string = import.meta.env.BASE_URL): string {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}
