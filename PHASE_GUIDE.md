# ParaBank Automation Framework — Phase-by-Phase Guide

This is the full roadmap for the project: what each phase adds, why it's sequenced that way, and exactly how to set up and run it at each stage. Read this alongside the code — it's meant to double as your own explanation notes for when someone asks "walk me through this project" in an interview.

---

## One-time setup (needed before any phase)

```bash
git clone <your-repo-url>       # or unzip the delivered folder
cd parabank-automation
npm install                     # installs @playwright/test, dotenv
npx playwright install --with-deps   # downloads Chromium/Firefox/WebKit binaries
cp .env.example .env            # local env config (ENV=prod by default)
```

`ENV=prod` in `.env` points the framework at the live public ParaBank site (`https://parabank.parasoft.com/parabank`) — that's the only real instance available, so that's what "prod" means here throughout every phase.

---

## Phase 1 — Core Framework + Login/Registration ✅ (done)

**What it is:** BasePage, LoginPage, RegistrationPage, fixtures, env config, 27 UI tests.

**Why this first:** Everything else in the project depends on this skeleton. If the POM structure, fixtures, and config reader aren't solid, every later phase inherits the same mistakes 40 more times over. Building Login/Registration first also gives you a working, provable "happy path" (register → log in) without needing a hardcoded account on a shared public site — every other module depends on being logged in, so this had to come first functionally too.

**How to run it:**
```bash
npm run test:ui          # all UI tests
npm run test:smoke       # just the @smoke-tagged subset
npx playwright test tests/ui/login.spec.js          # just login
npx playwright test tests/ui/registration.spec.js   # just registration
npm run test:headed      # watch it click through a real browser
npm run report           # view the HTML report after a run
```

**What to check if something fails:** ParaBank occasionally changes slightly between deployments. If a locator breaks, `npx playwright codegen https://parabank.parasoft.com/parabank/index.htm` will open a browser you can click through to regenerate the correct selector — bring the diff back here and we'll patch the page object.

---

## Phase 2 — Expand UI Coverage (Accounts, Transfer, Bill Pay) ✅ (done)

**What it adds:**
- `AccountsOverviewPage`, `TransferFundsPage`, `BillPayPage`, `FindTransactionsPage` page objects
- Login as a **fixture-level precondition** (most of these pages require an authenticated session)
- ~40 total UI test cases across all modules
- Tag system fully applied: `@smoke`, `@regression`, `@sanity`, `@e2e`

**Why now:** Phase 1 proved the framework *pattern* works. Phase 2 proves it *scales* — adding a 4th and 5th page object should take a fraction of the effort of the first two, because BasePage and fixtures already carry the shared logic. This is also the phase that actually earns the "CRUD, search, filter, sort, pagination" categories from your original brief — those only make sense once there's actual account/transaction data to operate on.

**How you'll set it up (when we build it):**
- A `loggedInPage` fixture will extend the existing fixtures file so every Phase 2 test starts already authenticated (register once in a `beforeAll`, reuse the session)
- New spec files: `tests/ui/accounts.spec.js`, `tests/ui/transfer.spec.js`, `tests/ui/billpay.spec.js`, `tests/ui/transactions.spec.js`

**How to run it (once built):**
```bash
npm run test:regression
npx playwright test tests/ui/transfer.spec.js --headed
```

---

## Phase 3 — API Testing + UI/API Hybrid ✅ (done)

**What it adds:**
- `api/` client wrapping Playwright's `APIRequestContext` against ParaBank's REST services (account details, transactions, bill pay)
- ~20 API test cases: status codes, response schema/field checks, negative cases (invalid account IDs, unauthorized access)
- Hybrid tests: e.g., *transfer funds via API, then verify the new balance shows correctly in the UI* — this is the pattern that actually demonstrates you understand testing beyond "click buttons"

**Why now, not earlier:** API tests are only meaningful once you know what data shape to expect — which Phase 2's UI work will have already surfaced (account IDs, transaction structures). Building the API layer in isolation first would mean guessing at contracts instead of testing real ones.

**How you'll set it up (when we build it):**
- `utilities/apiClient.js` — thin wrapper around `request.newContext({ baseURL: apiBaseURL })`
- `test-data/api-payloads.json` — realistic request bodies
- New spec files under `tests/api/`

**How to run it (once built):**
```bash
npm run test:api
```

---

## Phase 4 — Reporting + CI/CD ✅ (done)

**What it adds:**
- **Allure reporting**: `allure-playwright` reporter wired into `playwright.config.js`, `npm run allure:generate` / `allure:open` scripts
- **GitHub Actions workflow** (`.github/workflows/playwright.yml`): runs on every push/PR, installs dependencies, runs the full suite headless, uploads the HTML + Allure report as a build artifact
- A status badge for the README

**Why now, not in Phase 1:** Reporting is only valuable once there's substantial test volume to report *on* — wiring up Allure against 2 page objects would just be decoration. Same logic for CI: a pipeline that only runs 27 tests doesn't demonstrate much; a pipeline running ~60+ UI + API tests across 3 browsers does. This is also genuinely the phase interviewers/recruiters check first when they open your repo — a green "Actions" badge at the top of the README carries real weight.

**How you'll set it up (when we build it):**
```bash
npm install -D allure-playwright allure-commandline
npm run test              # generates raw allure-results/
npm run allure:generate   # builds the static HTML report
npm run allure:open       # opens it locally
```
The GitHub Actions workflow runs automatically once pushed — no local setup needed beyond having the repo on GitHub with Actions enabled (on by default).

---

## Phase 5 — Docker, Jenkins, Advanced Features ✅ (done)

**What it adds:**
- `Dockerfile` — containerized test execution (useful for interview talking points about consistent environments, not because you'll run Jenkins yourself)
- `Jenkinsfile` — declarative pipeline mirroring the GitHub Actions one, for teams using Jenkins instead
- Selectively added advanced features **only where ParaBank's real behavior supports them**: network/API mocking for one deliberately flaky scenario, cookie/session inspection on login, multi-tab handling if a ParaBank flow opens one (e.g. loan request confirmation)
- Final README polish: architecture diagram, "Future Enhancements" section

**Why last:** These are genuinely "nice to have, once the core is proven" — a Dockerfile around a framework that isn't reliable yet just containers the unreliability. This is also where I'll be most selective rather than exhaustive: things like a CSV/Excel utility only get added if there's a real test that needs to read one, not just to tick a box on the original brief. A shallow "we have 12 utility classes but none of them do anything real" is worse for you in an interview than having 4 that you can explain in depth.

**How you'll set it up (when we build it):**
```bash
docker build -t parabank-automation .
docker run --rm parabank-automation npm run test:smoke
```
Jenkins setup would require you to have a Jenkins instance (local or cloud) — I'll write the Jenkinsfile as a genuine, working pipeline definition, but running it is optional since GitHub Actions is what will actually be checked in the vast majority of cases.

---

## Summary table

| Phase | Focus | Proves |
|---|---|---|
| 1 ✅ | Core framework, Login/Registration | You can architect a clean POM framework |
| 2 ✅ | Accounts, Transfer, Bill Pay — full UI suite | The pattern scales across modules |
| 3 ✅ | API tests + hybrid | You test beyond the UI layer |
| 4 ✅ | Allure + GitHub Actions | The project runs green in CI, unattended |
| 5 ✅ | Docker, Jenkins, selective extras | Production-adjacent polish, without padding |

All 5 phases are complete — 72 total test cases across UI, API, and hybrid suites. The README's "What's implemented" sections have the full per-phase detail; this guide is the "why, in this order" explanation to keep alongside it for interview prep.
