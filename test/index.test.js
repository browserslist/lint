import './no-color.js'

import { equal } from 'uvu/assert'
import { test } from 'uvu'

import { lint, formatReport } from '../index.js'

function hasProblem(problems, id, fixed) {
  equal(problems.filter(p => p.id === id && p.fixed === fixed).length, 1)
}

function doesNotHaveProblem(problems, id) {
  equal(problems.filter(p => p.id === id).length, 0)
}

test('reports missedNotDead problem', () => {
  hasProblem(
    lint(['last 2 major versions', 'last 2 versions']),
    'missedNotDead',
    'last 2 major versions, last 2 versions, not dead'
  )
  doesNotHaveProblem(
    lint(['last 2 major versions', 'last 2 versions', 'not dead']),
    'missedNotDead'
  )
})

test('reports limitedBrowsers problem', () => {
  let problemQueries = [
    'last 2 firefox versions',
    'last 2 firefox major versions',
    'unreleased firefox versions',
    'firefox 0-10',
    'firefox > 0',
    'firefox 11',
    'chrome 11',
    'chrome > 11'
  ]
  hasProblem(
    lint(problemQueries),
    'limitedBrowsers',
    problemQueries.join(', ') + ', 2 versions, not dead'
  )
  doesNotHaveProblem(
    lint([
      'chrome > 0',
      'firefox > 0',
      'edge > 0',
      'ie > 0',
      'opera > 0',
      'safari > 0',
      'samsung > 0'
    ]),
    'limitedBrowsers'
  )
})

test('reports countryWasIgnored problem', () => {
  hasProblem(
    lint(['last 1 versions']),
    'countryWasIgnored',
    '>0.3%, last 1 versions'
  )
  hasProblem(
    lint(['>2%, >10%, last 1 versions']),
    'countryWasIgnored',
    '>0.3%, last 1 versions'
  )
  doesNotHaveProblem(lint(['last 100 versions']), 'countryWasIgnored')
  doesNotHaveProblem(lint(['maintained node versions']), 'countryWasIgnored')
})

test('reports alreadyDead problem', () => {
  hasProblem(lint(['>1%, not ie 11, not dead']), 'alreadyDead', '>1%, not dead')
  hasProblem(lint(['>1%, not IE 11, not dead']), 'alreadyDead', '>1%, not dead')
  hasProblem(
    lint(['>1%, not Explorer 11, not dead']),
    'alreadyDead',
    '>1%, not dead'
  )
  hasProblem(lint(['defaults, not ie 11']), 'alreadyDead', 'defaults')
  doesNotHaveProblem(lint(['>1%, not ie 11']), 'alreadyDead')
})

test('formats report', () => {
  equal(
    formatReport(lint('last 1 versions')),
    '' +
      'missedNotDead      The not dead query skipped when using ' +
      'last N versions query\n' +
      'countryWasIgnored  Less than 80% coverage in China, United States, ' +
      'Indonesia, Brazil, Russia, and 33 more regions\n' +
      '\n' +
      '✖ 2 problems\n'
  )
  equal(
    formatReport(lint(['>0%', 'not dead', 'not ie 11', 'not bb 10'])),
    '' +
      'alreadyDead  not ie 11, and not bb 10 already in not dead\n' +
      '\n' +
      '✖ 1 problems\n'
  )
  equal(formatReport(lint('>0%')), '')
})

test.run()
