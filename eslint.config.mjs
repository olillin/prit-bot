import { includeIgnoreFile } from '@eslint/compat'
import eslint from '@eslint/js'
import globals from 'globals'
import { fileURLToPath } from 'node:url'
import tseslint from 'typescript-eslint'

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url))

export default tseslint.config(
    includeIgnoreFile(gitignorePath, 'Imported .gitignore patterns'),
    {
        files: ['src/**/*.ts'],
        languageOptions: {
            globals: globals.node,
            parserOptions: {
                project: ['./tsconfig.json', './tsconfig.test.json'],
                tsconfigRootDir: import.meta.dirname,
            },
        },
        extends: [
            eslint.configs.recommended,
            ...tseslint.configs.recommended,
            ...tseslint.configs.recommendedTypeChecked,
        ],
        rules: {
            'max-depth': ['error', { max: 3 }],
            '@typescript-eslint/no-deprecated': 'warn',
            '@typescript-eslint/no-base-to-string': 'off',
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
        },
    }
)
