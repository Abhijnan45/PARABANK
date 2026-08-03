const { BasePage } = require('./BasePage');

/**
 * BillPayPage — billpay.htm
 */
class BillPayPage extends BasePage {
  constructor(page) {
    super(page);
    this.payeeName = page.locator('input[name="payee.name"]');
    this.payeeStreet = page.locator('input[name="payee.address.street"]');
    this.payeeCity = page.locator('input[name="payee.address.city"]');
    this.payeeState = page.locator('input[name="payee.address.state"]');
    this.payeeZip = page.locator('input[name="payee.address.zipCode"]');
    this.payeePhone = page.locator('input[name="payee.phoneNumber"]');
    this.payeeAccountNumber = page.locator('input[name="payee.accountNumber"]');
    this.verifyAccountNumber = page.locator('input[name="verifyAccount"]');
    this.amountInput = page.locator('input[name="amount"]');
    this.fromAccountSelect = page.locator('select[name="fromAccountId"]');
    this.sendPaymentButton = page.locator('input[value="Send Payment"], button:has-text("Send Payment")');
    this.resultPanel = page.locator('#billpayResult');
    this.successHeading = page.locator('#billpayResult h1');
  }

  async open() {
    await this.goto('/billpay.htm');
    await this.waitForPageLoad();
  }

  async fillPayee(payee = {}) {
    const fieldMap = {
      name: this.payeeName,
      street: this.payeeStreet,
      city: this.payeeCity,
      state: this.payeeState,
      zipCode: this.payeeZip,
      phoneNumber: this.payeePhone,
      accountNumber: this.payeeAccountNumber,
      verifyAccountNumber: this.verifyAccountNumber,
      amount: this.amountInput,
    };
    for (const [key, locator] of Object.entries(fieldMap)) {
      if (payee[key] !== undefined) {
        await locator.fill(String(payee[key]));
      }
    }
  }

  async payBill(payee, fromAccountNumber) {
    await this.fillPayee(payee);
    if (fromAccountNumber) {
      await this.fromAccountSelect.selectOption({ label: fromAccountNumber });
    }
    await this.safeClick(this.sendPaymentButton);
  }

  async isPaymentComplete() {
    return this.isVisible(this.successHeading);
  }
}

module.exports = { BillPayPage };
