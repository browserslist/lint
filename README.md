# Browserslist Lint

<img width="120" height="120" alt="Browserslist logo by Anton Lovchikov"
     src="https://browserslist.github.io/browserslist/logo.svg" align="right">

Check your [Browserslist](https://github.com/browserslist/browserslist/) config
with target browsers for popular mistakes.

```sh
npx browserslist-lint
```

Rules:

* `missedNotDead`: lack of `no dead` with queries like `last 2 versions`.
* `countryWasIgnored`: bad coverage in some country with >10M Internet users.
* `limitedBrowsers`: ignoring browsers diversity by calling only
  a few browsers directly (like `last 2 Chrome browsers`) in config.
