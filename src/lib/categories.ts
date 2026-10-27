/**
 * @file categories.ts
 * @author: ForUltraplayer
 * @brief 항목 카테고리 상수와 표기 (zod 의존 없음, 브라우저 번들용). 배열 순서가 화면 표시 순서다.
 */
export const CATEGORIES = [
  'cpu-ram',
  'gpu',
  'storage',
  'files',
  'system',
  'mods',
  'image',
  'media',
  'install',
  'docs',
  'notification',
  'camera',
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  'cpu-ram': 'CPU·RAM',
  gpu: 'GPU',
  storage: '저장장치',
  files: '파일 관리',
  system: '시스템·진단',
  mods: '광고 제거·앱 개조',
  image: '이미지·캡처',
  media: '미디어·녹화',
  install: '설치 USB',
  docs: '문서',
  notification: '알림',
  camera: '카메라',
};
