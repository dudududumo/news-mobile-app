/**
 * ESLint配置文件
 * @file eslint.config.js
 * @description 项目代码质量检查和代码风格规范配置
 */

// 使用ESLint的扁平配置系统
export default [
  {
    // 忽略不需要检查的文件和目录
    ignores: ['dist/**', 'node_modules/**'],
  },
  {
    // 配置JavaScript和JSX文件的检查规则
    files: ['**/*.js', '**/*.jsx'],

    // 语言选项
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        browser: true,
        console: true,
        window: true,
        document: true
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },

    // 规则配置
    rules: {
      // 基础JavaScript规则
      'no-unused-vars': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'indent': ['error', 2, { SwitchCase: 1 }],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never']
    }
  }
];
