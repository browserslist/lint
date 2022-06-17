import browserslist from 'browserslist'
import pico from 'picocolors'

const LIMITED_BROWSERS_COUNT = 4
const COUNTRIES_1M = [
  'AE',
  'AF',
  'AL',
  'AM',
  'AO',
  'AR',
  'AT',
  'AU',
  'AZ',
  'BA',
  'BD',
  'BE',
  'BF',
  'BG',
  'BH',
  'BI',
  'BJ',
  'BO',
  'BR',
  'BW',
  'BY',
  'CA',
  'CD',
  'CF',
  'CG',
  'CH',
  'CI',
  'CL',
  'CM',
  'CN',
  'CO',
  'CR',
  'CU',
  'CY',
  'CZ',
  'DE',
  'DK',
  'DO',
  'EC',
  'EE',
  'EG',
  'ER',
  'ES',
  'ET',
  'FI',
  'FR',
  'GA',
  'GB',
  'GE',
  'GH',
  'GM',
  'GN',
  'GQ',
  'GR',
  'GT',
  'GW',
  'HK',
  'HN',
  'HR',
  'HT',
  'HU',
  'ID',
  'IE',
  'IL',
  'IN',
  'IQ',
  'IR',
  'IT',
  'JM',
  'JO',
  'JP',
  'KE',
  'KG',
  'KH',
  'KP',
  'KR',
  'KW',
  'KZ',
  'LA',
  'LB',
  'LK',
  'LR',
  'LS',
  'LT',
  'LV',
  'LY',
  'MA',
  'MD',
  'MG',
  'MK',
  'ML',
  'MM',
  'MN',
  'MR',
  'MU',
  'MW',
  'MX',
  'MY',
  'MZ',
  'NA',
  'NE',
  'NG',
  'NI',
  'NL',
  'NO',
  'NP',
  'NZ',
  'OM',
  'PA',
  'PE',
  'PG',
  'PH',
  'PK',
  'PL',
  'PR',
  'PS',
  'PT',
  'PY',
  'QA',
  'RO',
  'RS',
  'RU',
  'RW',
  'SA',
  'SD',
  'SE',
  'SG',
  'SI',
  'SK',
  'SL',
  'SN',
  'SO',
  'SV',
  'SY',
  'SZ',
  'TD',
  'TG',
  'TH',
  'TJ',
  'TL',
  'TM',
  'TN',
  'TR',
  'TT',
  'TW',
  'TZ',
  'UA',
  'UG',
  'US',
  'UY',
  'UZ',
  'VE',
  'VN',
  'YE',
  'ZA',
  'ZM',
  'ZW'
]
const COUNTRIES_MIN_COVERAGE = 80

function getTotalCoverage(data) {
  let total = 0
  for (let i in data) {
    total += data[i] || 0
  }
  return total
}

const CHECKS = {
  missedNotDead(ast) {
    let hasLastQuery = ast.some(query => query.type.startsWith('last_'))
    let hasNotDeadQuery = ast.some(query => query.type === 'dead' && query.not)
    if (hasLastQuery && !hasNotDeadQuery) {
      return '`not dead` query skipped when using `last N versions` query'
    } else {
      return false
    }
  },

  limitedBrowsers(ast) {
    let browsers = new Set(ast.map(query => query.browser))
    let onlyBrowsersQueries = ast.every(query => 'browser' in query)
    if (onlyBrowsersQueries && browsers.size < LIMITED_BROWSERS_COUNT) {
      return 'given config is narrowly limited for specific vendors'
    } else {
      return false
    }
  },

  countryWasIgnored(ast, browsers) {
    let coverage
    let countries = []
    let tx = 0
    COUNTRIES_1M.forEach(country => {
      coverage = browserslist.coverage(browsers, country)
      tx = 100 / getTotalCoverage(browserslist.usage[country])
      if (coverage * tx < COUNTRIES_MIN_COVERAGE) {
        countries.push(country)
      }
    })
    if (countries.length > 0) {
      let msg = 'given config has poor coverage in '
      let regions = countries.slice(0, 5).join(', ')
      if (countries.length > 5) {
        regions += ', and ' + (countries.length - 5) + ' more regions'
      } else {
        /* c8 ignore next */
        regions = regions.replace(/, (\w+)$/, ', and $1 regions')
      }
      return msg + regions
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
    let message = CHECKS[id](ast, browsers)
    if (message) {
      problems.push({ id, message })
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

    return (
      str +
      pico.yellow('[' + problem.id + ']') +
      offset +
      problem.message +
      '\n'
    )
  }, '')

  report += '\n' + pico.red('✖ ') + problems.length + ' problems\n'

  return report
}
