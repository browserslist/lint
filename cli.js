#!/usr/bin/env node

import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'
import { join } from 'path'

import { lint, formatReport } from './index.js'

const ROOT = join(fileURLToPath(import.meta.url), '..')

function getPackage() {
  return JSON.parse(readFileSync(join(ROOT, 'package.json')))
}

let args = process.argv.slice(2)

let USAGE =
  'Usage:\n' +
  '  npx browserslist-lint\n' +
  '  npx browserslist-lint "QUERIES"\n' +
  '  npx browserslist-lint --json "QUERIES"\n' +
  '  npx browserslist-lint --config="path/to/browserlist/file"\n' +
  '  npx browserslist-lint --env="environment name defined in config"\n' +
  '  npx browserslist-lint --stats="path/to/browserlist/stats/file"\n'

function isArg(arg) {
  return args.some(str => {
    return str === arg || str.indexOf(arg + '=') === 0
  })
}

function error(msg) {
  process.stderr.write('browserslist: ' + msg + '\n')
  process.exit(1)
}

if (isArg('--help') || isArg('-h')) {
  process.stdout.write(getPackage().description + '.\n\n' + USAGE + '\n')
} else if (isArg('--version') || isArg('-v')) {
  process.stdout.write('browserslist-lint ' + getPackage().version + '\n')
} else {
  let mode = 'human'
  let opts = {}
  let queries

  for (let i = 0; i < args.length; i++) {
    if (args[i][0] !== '-') {
      queries = args[i].replace(/^["']|["']$/g, '')
      continue
    }

    let arg = args[i].split('=')
    let name = arg[0]
    let value = arg[1]

    if (value) value = value.replace(/^["']|["']$/g, '')

    if (name === '--config' || name === '-b') {
      opts.config = value
    } else if (name === '--env' || name === '-e') {
      opts.env = value
    } else if (name === '--stats' || name === '-s') {
      opts.stats = value
    } else if (name === '--json') {
      mode = 'json'
    } else {
      error('Unknown arguments ' + args[i] + '.\n\n' + USAGE)
    }
  }

  let problems
  try {
    problems = lint(queries, opts)
  } catch (e) {
    if (e.name === 'BrowserslistError') {
      error(e.message)
    } else {
      throw e
    }
  }

  if (problems.length === 0) {
    process.exit(0)
  }

  if (mode === 'human') {
    process.stdout.write(formatReport(problems) + '\n')
  } else if (mode === 'json') {
    process.stdout.write(JSON.stringify(problems, null, '  ') + '\n')
  }
  process.exit(1)
}
