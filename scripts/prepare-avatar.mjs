/**
 * @file prepare-avatar.mjs
 * @author: ForUltraplayer
 * @brief 빌드 때 GitHub 프로필 이미지를 public/avatar.png로 받는다(CI 실패, 로컬 경고)
 */
import { mkdir, writeFile, access } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const AVATAR_URL = 'https://github.com/ForUltraplayer.png?size=96';

export async function prepareAvatar({ fetchImpl = fetch, outFile, ci, log = console.warn }) {
  let reason;
  try {
    const response = await fetchImpl(AVATAR_URL, {
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });
    const type = response.headers.get('content-type') ?? '';
    if (response.status === 200 && type.startsWith('image/')) {
      const bytes = new Uint8Array(await response.arrayBuffer());
      await mkdir(dirname(outFile), { recursive: true });
      await writeFile(outFile, bytes);
      return 'downloaded';
    }
    reason = response.status === 200 ? `이미지가 아닌 응답(${type || '없음'})` : `상태 ${response.status}`;
  } catch (e) {
    reason = `요청 실패(${e instanceof Error ? e.name : 'unknown'})`;
  }

  const message = `프로필 이미지 다운로드 실패: ${reason}`;
  if (ci) throw new Error(message);
  const hasFile = await access(outFile).then(() => true, () => false);
  log(`${message}${hasFile ? ' - 기존 파일을 유지합니다' : ' - 이미지 없이 진행합니다'}`);
  return hasFile ? 'kept' : 'missing';
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const ci = process.env.CI === 'true' || process.env.CI === '1';
  const outFile = fileURLToPath(new URL('../public/avatar.png', import.meta.url));
  prepareAvatar({ outFile, ci, log: console.warn }).then(
    (result) => console.log(`avatar: ${result}`),
    (e) => {
      console.error(e.message);
      process.exit(1);
    },
  );
}
