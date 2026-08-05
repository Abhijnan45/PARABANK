const { BasePage } = require('./BasePage');

/**
 * OpenAccountPage — openaccount.htm
 * Lets a logged-in customer open a new CHECKING or SAVINGS account,
 * funded from an existing account.
 */
class OpenAccountPage extends BasePage {
  constructor(page) {
    super(page);
    this.accountTypeSelect = page.locator('#type');
    this.fromAccountSelect = page.locator('#fromAccountId');
    this.openAccountButton = page.locator('input[value="Open New Account"], #openAccountForm button, button:has-text("Open New Account")');
    this.resultPanel = page.locator('#openAccountResult');
    this.newAccountIdLink = page.locator('#newAccountId');
    this.successHeading = page.locator('#openAccountResult h1');
  }

  async open() {
    await this.goto('openaccount.htm');
    await this.waitForPageLoad();
  }

  /**
   * @param {'CHECKING'|'SAVINGS'} accountType
   * @param {string} [fromAccountNumber] - if omitted, uses whichever
   *   account is selected by default (ParaBank pre-selects the first)
   */
  async openNewAccount(accountType, fromAccountNumber) {
    await this.accountTypeSelect.selectOption({ label: accountType });
    if (fromAccountNumber) {
      await this.fromAccountSelect.selectOption({ label: fromAccountNumber });
    }
    await this.safeClick(this.openAccountButton);
    await this.resultPanel.waitFor({ state: 'visible' });
  }

  async getNewAccountNumber() {
    return this.getText(this.newAccountIdLink);
  }

  async getSuccessHeadingText() {
    return this.getText(this.successHeading);
  }
}

module.exports = { OpenAccountPage };
