/**
 * BasePage
 *
 * Holds actions and waits shared by every page object in the framework.
 * Page objects extend this rather than re-implementing common Playwright
 * interactions, so a change to how we (say) fill a field only happens
 * in one place.
 */
class BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  async goto(path = '') {
    await this.page.goto(path);
  }

  async getTitle() {
    return this.page.title();
  }

  async getCurrentUrl() {
    return this.page.url();
  }

  /**
   * Fill a field only after asserting it's visible and enabled —
   * avoids the classic flake of typing into a field that hasn't
   * finished rendering yet.
   */
  async safeFill(locator, value) {
    await locator.waitFor({ state: 'visible' });
    await locator.fill(value);
  }

  async safeClick(locator) {
    await locator.waitFor({ state: 'visible' });
    await locator.click();
  }

  async getText(locator) {
    await locator.waitFor({ state: 'visible' });
    return (await locator.textContent())?.trim();
  }

  async isVisible(locator) {
    try {
      await locator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Custom wait for ParaBank's server-rendered pages, which don't have
   * a SPA loading indicator — waiting on network idle is the closest
   * reliable signal that the page has finished rendering.
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }
}

module.exports = { BasePage };
