/**
 * Environment configuration reader.
 *
 * ParaBank (https://parabank.parasoft.com) is a single publicly-hosted
 * Parasoft demo instance — there is no separate dev/qa/stage deployment
 * of it available to point at. Rather than fake multiple environments
 * against the same URL, this reader is built to genuinely support
 * multiple environments (via ENV var + .env files) so the framework is
 * ready to point at real dev/qa/stage deployments the moment they exist
 * (e.g. if this framework is reused against an internal app later).
 *
 * Usage: ENV=qa npx playwright test  (defaults to "prod" -> the live ParaBank site)
 */
require('dotenv').config();

const environments = {
  prod: {
    baseURL: 'https://parabank.parasoft.com/parabank/',
    apiBaseURL: 'https://parabank.parasoft.com/parabank/services/bank',
  },
  // Placeholder environments for framework extensibility.
  // Point these at a locally-deployed ParaBank instance (see parasoft/parabank
  // on GitHub) if you stand one up for isolated/parallel-safe test runs.
  qa: {
    baseURL: process.env.QA_BASE_URL || 'https://parabank.parasoft.com/parabank/',
    apiBaseURL: process.env.QA_API_BASE_URL || 'https://parabank.parasoft.com/parabank/services/bank',
  },
  dev: {
    baseURL: process.env.DEV_BASE_URL || 'http://localhost:8080/parabank/',
    apiBaseURL: process.env.DEV_API_BASE_URL || 'http://localhost:8080/parabank/services/bank',
  },
};

const currentEnv = process.env.ENV || 'prod';
const config = environments[currentEnv];

if (!config) {
  throw new Error(
    `Unknown ENV "${currentEnv}". Valid options: ${Object.keys(environments).join(', ')}`
  );
}

module.exports = {
  env: currentEnv,
  baseURL: config.baseURL,
  apiBaseURL: config.apiBaseURL,
  timeout: Number(process.env.TEST_TIMEOUT) || 30000,
  retries: Number(process.env.TEST_RETRIES) || 1,
};