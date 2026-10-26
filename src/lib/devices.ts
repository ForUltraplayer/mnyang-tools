/**
 * @file devices.ts
 * @author: ForUltraplayer
 * @brief 디바이스 상수와 표기 (zod 의존 없음, 브라우저 번들용)
 */
export const DEVICES = ['windows', 'android', 'web'] as const;
export type Device = (typeof DEVICES)[number];

export const DEVICE_LABELS: Record<Device, string> = {
  windows: 'Windows',
  android: 'Android',
  web: '웹',
};
