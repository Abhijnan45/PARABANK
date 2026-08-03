# Uses Microsoft's official Playwright image, which ships with the
# exact browser binaries + OS dependencies matching @playwright/test's
# version — avoids the classic "works on my machine, fails in CI"
# browser-dependency mismatch.
FROM mcr.microsoft.com/playwright:v1.47.0-jammy

WORKDIR /app

# Copy dependency manifests first so Docker's layer cache only
# reinstalls node_modules when package.json actually changes, not on
# every source-code edit.
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

ENV CI=true
ENV ENV=prod

# Default command runs the smoke suite — the fast, CI-friendly subset.
# Override at `docker run` time for other suites, e.g.:
#   docker run --rm parabank-automation npm run test:regression
CMD ["npm", "run", "test:smoke"]
