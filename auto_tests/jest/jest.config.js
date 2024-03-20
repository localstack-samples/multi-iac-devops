module.exports = {
    preset: 'ts-jest',
    "globalSetup": "jest-environment-puppeteer/setup",
    "globalTeardown": "jest-environment-puppeteer/teardown",
    "testEnvironment": "jest-environment-puppeteer"
}
