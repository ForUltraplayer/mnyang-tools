/**
 * @file schema.ts
 * @author: ForUltraplayer
 * @brief 항목(items) 컬렉션의 zod 스키마와 디바이스·출처 상수
 */
import { z } from 'astro/zod';

import { DEVICES, DEVICE_LABELS, type Device } from './devices';
export { DEVICES, DEVICE_LABELS, type Device };

export const SOURCES = ['mine', 'modified', 'external'] as const;
export type Source = (typeof SOURCES)[number];

export const SOURCE_LABELS: Record<Source, string> = {
  mine: '직접 만듦',
  modified: '수정판',
  external: '외부',
};

export const itemSchema = z
  .object({
    title: z.string().min(1),
    summary: z.string().min(1),
    devices: z.array(z.enum(DEVICES)).min(1),
    source: z.enum(SOURCES),
    repo: z.string().regex(/^[\w.-]+\/[\w.-]+$/).optional(),
    website: z.url().optional(),
    download: z.url().optional(),
    order: z.number().default(100),
  })
  .refine((d) => d.repo !== undefined || d.website !== undefined, {
    message: 'repo 또는 website 중 하나는 필요하다',
  });

export type ItemData = z.infer<typeof itemSchema>;

export function isOwned(source: Source): boolean {
  return source === 'mine' || source === 'modified';
}
