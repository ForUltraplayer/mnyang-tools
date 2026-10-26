// @file astro.config.mjs
// @author: ForUltraplayer
// @brief Astro 설정 (정적 사이트, GitHub Pages 하위 경로 배포)
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://forultraplayer.github.io',
  base: '/mnyang-tools',
});
