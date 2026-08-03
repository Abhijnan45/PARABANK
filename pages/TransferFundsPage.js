const { BasePage } = require('./BasePage');

/**
 * TransferFundsPage — transfer.htm
 */
class TransferFundsPage extends BasePage {
  constructor(page) {
    super(page);
    this.amountInput = page.locator('#amount');
    this.fromAccountSelect = page.locator('#fromAccountId');
    this.toAccountSelect = page.locator('#toAccountId');
    this.transferButton = page.locator('input[value="Transfer"], button:has-text("Transfer")');
    this.resultPanel = page.locator('#showResult');
    this.successHeading = page.locator('#showResult h1.title');
    this.amountResult = page.locator('#amountResult');
    this.fromAccountResult = page.locator('#accountResult');
    this.errorMessage = page.locator('.error');
  }

  async open() {
    await this.goto('/transfer.htm');
    await this.waitForPageLoad();
  }

  async transfer(amount, fromAccountNumber, toAccountNumber) {
    await this.safeFill(this.amountInput, String(amount));
    if (fromAccountNumber) {
      await this.fromAccountSelect.selectOption({ label: fromAccountNumber });
    }
    if (toAccountNumber) {
      await this.toAccountSelect.selectOption({ label: toAccountNumber });
    }
    await this.safeClick(this.transferButton);
  }

  async isTransferComplete() {
    return this.isVisible(this.successHeading);
  }
}

module.exports = { TransferFundsPage };
