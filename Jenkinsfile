// Declarative Jenkins pipeline mirroring the GitHub Actions workflow,
// for teams whose CI runs on Jenkins instead. Mirrors the same stages
// deliberately, rather than a different structure, so both pipelines
// are easy to reason about side by side.
pipeline {
    agent any

    parameters {
        choice(
            name: 'TEST_SUITE',
            choices: ['smoke', 'regression', 'ui', 'api', 'hybrid', 'all'],
            description: 'Which suite to run'
        )
        choice(
            name: 'BROWSER',
            choices: ['chromium', 'firefox', 'webkit', 'all'],
            description: 'Which browser project to run against'
        )
    }

    environment {
        ENV = 'prod'
        CI = 'true'
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Install Playwright browsers') {
            steps {
                sh 'npx playwright install --with-deps'
            }
        }

        stage('Run tests') {
            steps {
                script {
                    def browserFlag = (params.BROWSER == 'all') ? '' : "--project=${params.BROWSER}"
                    def command = [
                        smoke     : "npx playwright test --grep @smoke ${browserFlag}",
                        regression: "npx playwright test --grep @regression ${browserFlag}",
                        ui        : "npx playwright test tests/ui ${browserFlag}",
                        api       : "npx playwright test tests/api ${browserFlag}",
                        hybrid    : "npx playwright test tests/api/hybrid.spec.js ${browserFlag}",
                        all       : "npx playwright test ${browserFlag}",
                    ][params.TEST_SUITE]
                    sh command
                }
            }
        }

        stage('Generate Allure report') {
            steps {
                sh 'npm run allure:generate'
            }
        }
    }

    post {
        always {
            // Requires the Allure Jenkins plugin. If it isn't installed,
            // this stage is safe to remove — the raw allure-results/
            // and reports/html-report/ are still archived below.
            script {
                try {
                    allure includeProperties: false, jdk: '', results: [[path: 'allure-results']]
                } catch (err) {
                    echo "Allure Jenkins plugin not available: ${err}"
                }
            }
            archiveArtifacts artifacts: 'reports/**, allure-results/**', allowEmptyArchive: true
            junit allowEmptyResults: true, testResults: 'reports/junit-results.xml'
        }
        failure {
            archiveArtifacts artifacts: 'test-results/**', allowEmptyArchive: true
        }
    }
}
