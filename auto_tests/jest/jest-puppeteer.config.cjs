/** @type {import('jest-environment-puppeteer').JestPuppeteerConfig} */
module.exports = {
    // Don't use a sandbox in CI, to avoid issues with permissions
    launch: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
}