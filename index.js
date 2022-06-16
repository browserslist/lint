import browserslist from 'browserslist'
import pico from 'picocolors'

let NOT_DEAD_QUERY = /^not dead$/i
let LIMITED_BROWSERS_COUNT = 7
let LIMITED_BROWSERS_QUERIES = [
  [browserslist.parser.QUERIES.LAST_BROWSER_MAJOR_VERSIONS, 2],
  [browserslist.parser.QUERIES.LAST_BROWSER_VERSIONS, 2],
  [browserslist.parser.QUERIES.UNRELEASED_BROWSER_VERSIONS, 1],
  [browserslist.parser.QUERIES.BROWSER_RANGE, 1],
  [browserslist.parser.QUERIES.BROWSER_RAY, 1],
  [browserslist.parser.QUERIES.BROWSER_VERSION, 1]
]
let COUNTRIES_1M = [
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
let COUNTRIES_MIN_COVERAGE = 80

function getTotalCoverage(data) {
  let total = 0

  for (let i in data) {
    total += data[i] || 0
  }

  return total
}

let rules = [
  {
    id: 'missed-not-dead',
    check(queries) {
      let hasLastQuery
      let hasNotDeadQuery

      queries.some(query => {
        if (!hasNotDeadQuery && NOT_DEAD_QUERY.test(query)) {
          hasNotDeadQuery = true
        } else if (!hasLastQuery) {
          hasLastQuery =
            browserslist.parser.QUERIES.LAST_MAJOR_VERSIONS.test(query) ||
            browserslist.parser.QUERIES.LAST_VERSIONS.test(query)
        }

        return hasLastQuery && hasNotDeadQuery
      })

      return hasLastQuery && !hasNotDeadQuery
    },
    message: '`not dead` query skipped when using `last N versions` query'
  },
  {
    id: 'limited-browsers',
    check(queries) {
      let browsers = []
      let match
      let onlyBrowsersQueries = queries.every(query => {
        return LIMITED_BROWSERS_QUERIES.some(regexp => {
          match = regexp[0].exec(query)

          if (match) {
            match = match[regexp[1]]

            if (match) {
              if (browsers.indexOf(match) === -1) {
                browsers.push(match)
              }

              return true
            }
          }

          return false
        })
      })

      return onlyBrowsersQueries && browsers.length < LIMITED_BROWSERS_COUNT
    },
    message: 'given config is narrowly limited'
  },
  {
    id: 'country-was-ignored',
    check(queries, opts) {
      let coverage
      let countries = []
      let tx = 0

      COUNTRIES_1M.forEach(country => {
        coverage = browserslist.coverage(browserslist(queries, opts), country)
        tx = 100 / getTotalCoverage(browserslist.usage[country])

        if (coverage * tx < COUNTRIES_MIN_COVERAGE) {
          countries.push(country)
        }
      })

      return countries.length ? countries : false
    },
    message(meta) {
      let msg = 'given config has poor coverage in '
      let regions = meta.slice(0, 5).join(', ')

      if (meta.length > 5) {
        regions += ' and ' + (meta.length - 5) + ' more regions'
      } /* c8 ignore start */ else {
        regions = regions.replace(/, (\w+)$/, ' and $1 regions')
      } /* c8 ignore end */

      return msg + regions
    }
  }
]

export function lint(queries, opts) {
  let meta

  if (typeof queries === 'string') {
    queries = [queries]
  }

  return rules.reduce((problems, rule) => {
    meta = rule.check(queries, opts)

    if (meta) {
      problems.push({
        id: rule.id,
        message:
          typeof rule.message === 'function' ? rule.message(meta) : rule.message
      })
    }

    return problems
  }, [])
}

export function formatReport(problems) {
  if (!problems.length) {
    return ''
  }

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
