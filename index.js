import browserslist from 'browserslist'
import pico from 'picocolors'

const LIMITED_BROWSERS_COUNT = 4
const COUNTRIES_MIN_COVERAGE = 80
// https://en.wikipedia.org/wiki/List_of_countries_by_number_of_Internet_users
const COUNTRIES_10M = {
  CN: 'China',
  IN: 'India',
  US: 'United States',
  ID: 'Indonesia',
  BR: 'Brazil',
  NG: 'Nigeria',
  BD: 'Bangladesh',
  RU: 'Russia',
  PK: 'Pakistan',
  JP: 'Japan',
  MX: 'Mexico',
  IR: 'Iran',
  DE: 'Germany',
  PH: 'Philippines',
  TR: 'Turkey',
  VN: 'Vietnam',
  GB: 'United Kingdom',
  FR: 'France',
  EG: 'Egypt',
  TH: 'Thailand',
  IT: 'Italy',
  KR: 'South Korea',
  ES: 'Spain',
  PL: 'Poland',
  CA: 'Canada',
  AR: 'Argentina',
  ZA: 'South Africa',
  UA: 'Ukraine',
  CO: 'Colombia',
  TZ: 'Tanzania',
  SA: 'Saudi Arabia',
  DZ: 'Algeria',
  MY: 'Malaysia',
  MA: 'Morocco',
  TW: 'Taiwan',
  AU: 'Australia',
  VE: 'Venezuela',
  ET: 'Ethiopia',
  IQ: 'Iraq',
  UZ: 'Uzbekistan',
  MM: 'Myanmar',
  NP: 'Nepal',
  NL: 'Netherlands',
  PE: 'Peru',
  GH: 'Ghana',
  CL: 'Chile',
  KZ: 'Kazakhstan',
  RO: 'Romania',
  SD: 'Sudan',
  GT: 'Guatemala',
  CI: 'Ivory Coast',
  UG: 'Uganda',
  BE: 'Belgium'
}

function getTotalCoverage(data) {
  let total = 0
  for (let i in data) {
    total += data[i] || 0
  }
  return total
}

function concat(array) {
  return array.join(', ').replace(/, ([^,]+)$/, ', and $1')
}

const CHECKS = {
  missedNotDead(ast) {
    let hasLast = ast.some(query => query.type.startsWith('last_'))
    let hasNotDead = ast.some(query => query.type === 'dead' && query.not)
    if (hasLast && !hasNotDead) {
      return [
        'The `not dead` query skipped when using `last N versions` query',
        'fixed missedNotDead'
      ]
    } else {
      return false
    }
  },

  limitedBrowsers(ast) {
    let browsers = new Set(ast.map(query => query.browser))
    let onlyBrowsersQueries = ast.every(query => 'browser' in query)
    if (onlyBrowsersQueries && browsers.size < LIMITED_BROWSERS_COUNT) {
      return [
        'Given config is narrowly limited for specific vendors',
        'fixed limitedBrowsers'
      ]
    } else {
      return false
    }
  },

  countryWasIgnored(ast, browsers) {
    // The Node.js is not in the Can I Use db
    let browsersWithStats = browsers.filter(i => !i.startsWith('node'))
    if (!browsersWithStats.length) return false

    let coverage
    let countries = []
    let tx = 0
    for (let code in COUNTRIES_10M) {
      coverage = browserslist.coverage(browsersWithStats, code)
      tx = 100 / getTotalCoverage(browserslist.usage[code])
      if (coverage * tx < COUNTRIES_MIN_COVERAGE) {
        countries.push(COUNTRIES_10M[code])
      }
    }
    if (countries.length > 0) {
      let msg = 'Less than 80% coverage in '
      let names = countries.map(i => '`' + i + '`')
      if (names.length > 5) {
        names = names.slice(0, 5).concat([`${countries.length - 5} more`])
      }
      return [msg + concat(names) + ' regions', 'fixed countryWasIgnored']
    } else {
      return false
    }
  },

  alreadyDead(ast) {
    let hasNotDead = ast.some(query => query.type === 'dead' && query.not)
    let hasDefaults = ast.some(query => query.type === 'defaults' && !query.not)
    if (!hasNotDead && !hasDefaults) return false

    let dead = browserslist('dead')
    let duplicates = ast
      .filter(query => query.type === 'browser_version' && query.not)
      .map(query => {
        let name = query.browser.toLowerCase()
        let normalized = browserslist.aliases[name] || name
        return `${normalized} ${query.version}`
      })
      .filter(str => dead.includes(str))

    if (duplicates.length > 0) {
      let msg
      let str = concat(duplicates.map(i => '`not ' + i + '`')) + ' already in '
      if (hasNotDead) {
        msg = str + '`not dead`'
      } else {
        msg = str + '`defaults`'
      }
      return [msg, 'fixed alreadyDead']
    } else {
      return false
    }
  }
}

export function lint(queries, opts) {
  let ast = browserslist.parse(queries, opts)
  let browsers = browserslist(queries, opts)

  let problems = []
  for (let id in CHECKS) {
    let [message, fixed] = CHECKS[id](ast, browsers)
    if (message) {
      problems.push({ id, message, fixed })
    }
  }
  return problems
}

export function formatReport(problems) {
  if (!problems.length) return ''

  let report = ''
  let maxProblemIdWidth = problems.reduce((prev, problem) => {
    return Math.max(prev, problem.id.length)
  }, 0)
  let offset

  report += problems.reduce((str, problem) => {
    offset = maxProblemIdWidth - problem.id.length + 3
    offset = Array(offset).join(' ')
    let message = problem.message.replace(/`[^`]+`/g, code => {
      return pico.yellow(code.slice(1, -1))
    })
    return str + pico.gray(problem.id) + offset + message + '\n'
  }, '')

  report += '\n' + pico.red('✖ ') + problems.length + ' problems\n'

  return report
}
