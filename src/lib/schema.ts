/**
 * @file schema.ts
 * @author: ForUltraplayer
 * @brief 항목(items) 컬렉션의 zod 스키마와 디바이스·출처 상수
 */
import { z } from 'astro/zod';

import { CATEGORIES, CATEGORY_LABELS, type Category } from './categories';
import { DEVICES, DEVICE_LABELS, type Device } from './devices';
export { CATEGORIES, CATEGORY_LABELS, DEVICES, DEVICE_LABELS, type Category, type Device };

export const SOURCES = ['mine', 'modified', 'external'] as const;
export type Source = (typeof SOURCES)[number];

export const SOURCE_LABELS: Record<Source, string> = {
  mine: '직접 만듦',
  modified: '수정판',
  external: '외부',
};

// javascript: 같은 스킴을 막기 위해 http/https만 허용한다.
const httpUrl = z.url({ protocol: /^https?$/ });

export const itemSchema = z
  .object({
    title: z.string().min(1),
    summary: z.string().min(1),
    devices: z.array(z.enum(DEVICES)).min(1),
    source: z.enum(SOURCES),
    category: z.enum(CATEGORIES),
    repo: z.string().regex(/^[\w.-]+\/[\w.-]+$/).optional(),
    website: httpUrl.optional(),
    download: httpUrl.optional(),
    order: z.number().default(100),
  })
  .refine((d) => d.repo !== undefined || d.website !== undefined, {
    message: 'repo 또는 website 중 하나는 필요하다',
  });

export type ItemData = z.infer<typeof itemSchema>;

export function isOwned(source: Source): boolean {
  return source === 'mine' || source === 'modified';
}
