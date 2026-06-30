import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({ baseDirectory: __dirname })

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // Forzar uso de tipos explícitos en funciones públicas
      '@typescript-eslint/explicit-function-return-type': 'off',
      // No permitir any implícito
      '@typescript-eslint/no-explicit-any': 'error',
      // Imports no usados son error
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Preferir const
      'prefer-const': 'error',
      // No console.log en producción (solo warn y error permitidos)
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // Hooks de React deben seguir las reglas
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // No usar target="_blank" sin rel="noopener"
      'react/jsx-no-target-blank': 'error',
    },
  },
  {
    // Relajar reglas en archivos de test
    files: ['src/tests/**/*.ts', 'src/tests/**/*.tsx', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]

export default eslintConfig
