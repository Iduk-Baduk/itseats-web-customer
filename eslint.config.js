import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      
      // 보안 관련 규칙
      // deprecated 메서드 사용 금지
      'no-restricted-properties': [
        'error',
        {
          object: 'securityUtils',
          property: 'generateClientToken',
          message: '클라이언트 토큰 생성이 보안상 제거되었습니다. 서버에서 JWT를 발급받으세요.'
        },
        {
          object: 'securityUtils',
          property: 'verifyClientToken',
          message: '클라이언트 토큰 검증이 보안상 제거되었습니다. 서버에서 토큰을 검증하세요.'
        },
        {
          object: 'Math',
          property: 'random',
          message: '보안상 crypto.getRandomValues()를 사용하세요.'
        }
      ],
      
      // eval() 사용 금지 (보안상)
      'no-eval': 'error',
      
      // console.log 사용 제한 (프로덕션 환경)
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
    },
  },
]
