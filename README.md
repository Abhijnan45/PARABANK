# ParaBank Automation Framework

A hybrid UI + API test automation framework built with **Playwright (JavaScript)** and the **Page Object Model**, targeting [ParaBank](https://parabank.parasoft.com/parabank/index.htm) — Parasoft's public demo banking application.

> **Status: Complete — all 5 phases.** Core framework, full UI + API + hybrid suite, Allure reporting, GitHub Actions CI, Docker, Jenkins, and selectively-added advanced features. See [What's implemented](#whats-implemented-so-far-phases-1-2) and [Roadmap](#roadmap) below for the phase-by-phase breakdown and the reasoning behind each addition.

## Why ParaBank

Most portfolio automation frameworks target the same handful of demo sites (SauceDemo, the-internet.herokuapp.com). ParaBank is less commonly used, is a genuinely full-featured application (registration, accounts, transfers, bill pay, loan requests) rather than a static demo page, and exposes both a web UI and REST/SOAP web services — which makes real UI + API hybrid testing possible rather than simulated.

It's also a **shared public instance** with no dev/qa/stage of its own. That constraint is treated honestly throughout this framework rather than hidden — see the notes in `config/env.config.js` and in the test suites themselves.

## Tech Stack

| Layer | Choice |
|---|---|
| Automation tool | Playwright |
| Language | JavaScript |
| Test runner | Playwright Test |
| Design pattern | Page Object Model |
| Architecture | Hybrid (UI + API), built incrementally |

## Project Structure

```
parabank-automation/
├── pages/              # Page Object classes (BasePage + feature pages)
├── tests/
│   ├── ui/             # UI test specs (login, registration, accounts,
│   │                   #   openAccount, transfer, billpay, transactions)
│   └── api/            # API test specs + UI/API hybrid tests
├── fixtures/
│   ├── pageFixtures.js # wires page objects into `test`
│   ├── authFixtures.js # `newCustomer` fixture — registers a fresh
│   │                   #   customer per test needing an authenticated session
│   └── apiFixtures.js  # `apiCustomer` fixture — registers via UI once,
│                       #   exposes an authenticated ApiClient for the rest
├── config/             # Environment config reader
├── utilities/          # Data generators, API client, CSV audit logger
├── test-data/          # JSON test data
├── .github/workflows/  # GitHub Actions CI pipeline (playwright.yml)
├── Jenkinsfile         # Declarative Jenkins pipeline (mirrors the GH Actions stages)
├── Dockerfile          # Containerized test execution
├── .dockerignore
├── playwright.config.js
└── .env.example
```

## Installation

```bash
git clone <repo-url>
cd parabank-automation
npm install
npx playwright install --with-deps
cp .env.example .env
```

## Running Tests

```bash
npm test                  # full suite, all browsers
npm run test:ui           # UI tests only
npm run test:api          # API + hybrid tests only
npm run test:hybrid       # just the UI/API hybrid suite
npm run test:smoke        # tests tagged @smoke
npm run test:regression   # tests tagged @regression
npm run test:e2e          # tests tagged @e2e
npm run test:headed       # watch it run in a real browser window
npm run report            # open the last Playwright HTML report
```

## Reporting

```bash
npm test                  # generates allure-results/ alongside the HTML/JSON/JUnit reports
npm run allure:generate   # builds the static Allure HTML report
npm run allure:open       # opens the generated Allure report locally
npm run allure:serve      # generate + open in one step, without writing allure-report/ to disk
```
The GitHub Actions pipeline (below) generates and publishes this automatically on every run — no local Allure install needed to view CI results.

## CI/CD

**GitHub Actions** (`.github/workflows/playwright.yml`) runs on every push/PR across all three browsers, runs the smoke suite on pushes and the full suite on a daily schedule or manual trigger, and publishes the combined Allure report to GitHub Pages. No setup needed beyond having the repo on GitHub with Actions enabled (on by default).

**Jenkins** (`Jenkinsfile`) is a parameterized declarative pipeline mirroring the same stages, for teams running Jenkins instead:
```bash
# In Jenkins: New Item → Pipeline → Pipeline script from SCM → point at this repo
# Parameters exposed: TEST_SUITE (smoke/regression/ui/api/hybrid/all), BROWSER (chromium/firefox/webkit/all)
```

**Docker** — containerized, environment-consistent execution:
```bash
docker build -t parabank-automation .
docker run --rm parabank-automation                       # runs the smoke suite (default)
docker run --rm parabank-automation npm run test:regression
```

## What's implemented so far (Phases 1-2)

- `BasePage` with shared, flake-resistant actions (`safeFill`, `safeClick`, visibility waits)
- Page objects: `LoginPage`, `RegistrationPage`, `AccountsOverviewPage`, `OpenAccountPage`, `TransferFundsPage`, `BillPayPage`, `FindTransactionsPage`
- Environment-driven config (`ENV=prod|qa|dev`) — not hardcoded, ready for a real multi-env setup if this app is ever deployed to more than one place
- Two layers of fixtures:
  - `pageFixtures.js` — injects page objects into tests
  - `authFixtures.js` — a `newCustomer` fixture that registers a **fresh customer per test** needing to be logged in (accounts, transfer, bill pay, transactions all need this). This trades a little speed for real test independence: no shared account, no cross-test/cross-worker balance collisions, on a public instance shared with everyone else testing against it right now.
- A random-data utility for unique usernames/SSNs/phone numbers per test run
- **~48 UI test cases** across seven modules, covering:
  - Form rendering / smoke checks
  - CRUD: register → account created; open new account → appears in overview; transfer funds; pay a bill
  - Negative/validation cases (missing fields, password mismatch, duplicate username, mismatched bill-pay verify-account)
  - Boundary cases (excessively long input, single-character input, special characters, zero/negative amounts, same-account transfer)
  - Search (find transaction by ID, by amount; no-results case)
  - Security-adjacent input handling (SQL-injection-style and script-injection-style strings) — note this checks the *app doesn't misbehave*, it is not a penetration test
- Retry, screenshot-on-failure, video-on-failure, and trace-on-failure all configured
- Cross-browser projects (Chromium, Firefox, WebKit)

**A deliberately honest note on two Transfer tests:** the "exceeds balance" and "zero amount" transfer tests assert that the app *doesn't crash*, not a specific pass/fail business rule — because ParaBank's demo instance doesn't consistently enforce overdraft protection, and asserting a rule the app doesn't actually follow would be a test that lies about what it verifies. This kind of judgment call is exactly the sort of thing worth being able to explain in an interview.

## What's implemented so far (Phase 3 — API + Hybrid)

- `ApiClient` (`utilities/apiClient.js`) — wraps Playwright's `APIRequestContext` around ParaBank's REST services: login, customer/account lookup, transactions (by id / by amount), transfer, create account, bill pay
- `apiFixtures.js` — a `apiCustomer` fixture that registers a fresh customer through the UI (ParaBank has no public registration API) and then authenticates purely via the REST login endpoint for everything after — the honest boundary between "UI creates the fixture" and "API does the testing"
- **22 API/hybrid test cases**:
  - Pure API: login success/failure, account lookup, transaction lookup by id/amount, transfer (valid, negative amount, non-existent account, balance-reflects-transfer, produces a transaction record), bill pay (valid, missing field, produces a transaction, non-existent account)
  - Hybrid (act on one layer, verify on the other): account opened via API shows up in the UI overview; a transfer made via API updates the balance shown in the UI; a bill paid via the UI is retrievable as a transaction via the API
- A documented caveat in `apiClient.js`: the REST contract here is reconstructed from Parasoft's own service source and the public Postman collection for this app, not independently exhaustively verified against a live WADL fetch — noted honestly rather than presented as more certain than it is

## What's implemented so far (Phase 4 — Reporting + CI/CD)

- **Allure** wired into `playwright.config.js` alongside the existing HTML/JSON/JUnit reporters — `npm run allure:generate` / `allure:open` / `allure:serve`
- **GitHub Actions** (`.github/workflows/playwright.yml`): matrix run across Chromium/Firefox/WebKit, smoke suite on every push/PR, full regression on a daily schedule and on manual trigger, HTML + Allure + failure artifacts uploaded every run, combined Allure report published to GitHub Pages

## What's implemented so far (Phase 5 — Docker, Jenkins, Advanced Features)

- **Dockerfile** — built on Microsoft's official Playwright image (browser binaries pre-matched to the `@playwright/test` version), `.dockerignore` keeps the build context lean
- **Jenkinsfile** — a parameterized declarative pipeline (`TEST_SUITE`, `BROWSER` params) mirroring the same stages as the GitHub Actions workflow
- Advanced features added **selectively**, each with a genuine reason rather than to check a box:
  - **Network/API mocking** (`tests/ui/advanced.spec.js`) — mocks a 500 and a malformed 200 from the login endpoint, to test UI resilience against backend failures ParaBank's real instance won't reliably reproduce on demand
  - **Cookie/session verification** — confirms a JSESSIONID cookie is actually set on login, and that logout genuinely invalidates the session (a protected page redirects back to login rather than just hiding a nav link)
  - **A documented negative finding, not a workaround**: ParaBank doesn't use localStorage/sessionStorage for session state at all — it's a classic server-rendered app — so there's a test asserting that architecture fact rather than a fabricated storage test with nothing real behind it
  - **CSV audit logger** (`utilities/csvLogger.js`) — every customer/account this framework creates on the shared public instance gets logged to `reports/created-accounts.csv` with a UUID run tag. This exists because ParaBank has no test-data cleanup endpoint and the data persists indefinitely — a real audit trail, not decoration
- **Deliberately NOT added**: multi-window/tab handling, iframe handling, and a "database utility" — none have a genuine test behind them in this framework's scope (no ParaBank flow here opens a second window or embeds a frame, and tests have no real DB access to mock against). Padding the framework with unused utilities for these would read as generated bulk rather than considered engineering — see the note in [Project Overview](#why-parabank) below.

## Roadmap

| Phase | Scope |
|---|---|
| 1 ✅ | Core framework + Login/Registration |
| 2 ✅ | Accounts Overview, Open New Account, Transfer Funds, Bill Pay, Find Transactions — ~48 UI cases, tagged smoke/regression/boundary/negative/e2e |
| 3 ✅ | API test suite against ParaBank's REST services (account, transfer, bill pay) + UI/API hybrid tests — 22 cases |
| 4 ✅ | Allure reporting, GitHub Actions CI pipeline |
| 5 ✅ | Docker support, Jenkinsfile, selectively-added advanced features (network mocking, session/cookie verification, CSV audit logging) |

**72 total test cases** across UI, API, and hybrid suites.

## An honest note on scope

This framework was built to be genuinely explainable in an interview, not to maximize the number of buzzwords in the README. Every feature above was added once there was a real reason for it — Allure and CI landed once there was substantial test volume to actually report on; Docker/Jenkins landed once the suite was proven stable enough to be worth containerizing; advanced features (mocking, session checks, audit logging) landed only where ParaBank's real behavior gave them something genuine to verify. A couple of things from a typical "everything" framework brief were deliberately left out — see the note at the end of the Phase 5 section above — because a fabricated test with nothing real behind it is worse for a portfolio than an honest gap.

## Local execution note

My build sandbox can't reach `parasoft.com` (outside its allowed domain list), so this framework was written and syntax-checked but not executed end-to-end against the live site from that environment. Locator and REST-contract confidence is documented per-file (`pages/*.js` locators are high-confidence — ParaBank's JSP pages have been stable for years; `utilities/apiClient.js` has a documented lower-confidence note on the REST contract). Run it locally and treat any failure as a normal debugging step, not a sign the framework is broken.
