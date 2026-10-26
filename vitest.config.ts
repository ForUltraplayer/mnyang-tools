/**
 * @file vitest.config.ts
 * @author: ForUltraplayer
 * @brief Vitest 설정 (Astro getViteConfig 사용)
 */
/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
