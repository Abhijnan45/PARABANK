const { BasePage } = require('./BasePage');

/**
 * FindTransactionsPage — findtrans.htm
 * ParaBank exposes several tabs (by ID, by date, by date range, by
 * amount) on the same page. This page object covers the two most
 * commonly stable ones: by transaction ID and by amount.
 */
class FindTransactionsPage extends BasePage {
  constructor(page) {
    super(page);
    this.transactionIdInput = page.locator('#transactionId');
    this.findByIdButton = page.locator('#findById');
    this.amountInput = page.locator('#transactionAmount');
    this.findByAmountButton = page.locator('#findByAmount');
    this.transactionTable = page.locator('#transactionTable');
    this.noTransactionsMessage = page.locator('#noTransactionsMessage, .error');
  }

  async open() {
    await this.goto('/findtrans.htm');
    await this.waitForPageLoad();
  }

  async findByTransactionId(transactionId) {
    await this.safeFill(this.transactionIdInput, String(transactionId));
    await this.safeClick(this.findByIdButton);
  }

  async findByAmount(amount) {
    await this.safeFill(this.amountInput, String(amount));
    await this.safeClick(this.findByAmountButton);
  }

  async hasResults() {
    return this.isVisible(this.transactionTable);
  }
}

module.exports = { FindTransactionsPage };
