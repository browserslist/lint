import loguxConfig from '@logux/eslint-config'

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...loguxConfig,
  {
    rules: {
      'n/prefer-node-protocol': 'off',
      'perfectionist/sort-objects': 'off'
    }
  }
]
