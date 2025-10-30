import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  ignores: [
    // Ignore Claude Code plugin documentation
    // Ignore Claude Code skills documentation
    '.claude/skills/**',
    'skills/**',
    // Ignore documentation markdown files with code blocks
    'CLAUDE.md',
    'dev-docs/**/*.md',
  ],
}, {
  rules: {
    // CLI 도구 특성상 console 사용 필요
    'no-console': 'off',
    // Bun 런타임에서는 global process/buffer 사용이 일반적
    'node/prefer-global/process': 'off',
    'node/prefer-global/buffer': 'off',
    // Zod의 상수와 타입은 같은 이름을 공유하는 정상적인 패턴
    'ts/no-redeclare': 'off',
  },
})
