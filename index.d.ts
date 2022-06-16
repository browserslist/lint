import Browserslist from 'browserslist'

export interface BrowserslistProblem {
  id: string
  message: string
}

/**
 * Lint browserslist config.
 *
 * @param queries Browser queries.
 * @param opts Browserslist options.
 * @returns Lint problems.
 */
export function lint(
  queries: string | readonly string[],
  opts?: Browserslist.Options
): BrowserslistProblem[]

/**
 * Format linter output.
 *
 * @param problems Array from `lint()` call.
 */
export function formatReport(problems: BrowserslistProblem[]): string
