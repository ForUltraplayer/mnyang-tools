/**
 * @file content.config.ts
 * @author: ForUltraplayer
 * @brief items 콘텐츠 컬렉션 정의
 */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { itemSchema } from './lib/schema';

const items = defineCollection({
  loader: glob({ base: './src/content/items', pattern: '*.md' }),
  schema: itemSchema,
});

export const collections = { items };
