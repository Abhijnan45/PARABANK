const { BasePage } = require('./BasePage');

/**
 * AccountsOverviewPage — overview.htm
 * Lists all accounts belonging to the logged-in customer with balance
 * and available amount; account numbers link to account-detail (activity.htm).
 */
class AccountsOverviewPage extends BasePage {
  constructor(page) {
    super(page);
    this.accountTable = page.locator('#accountTable');
    this.accountRows = page.locator('#accountTable tbody tr');
    this.accountLinks = page.locator('#accountTable tbody tr td:first-child a');
    this.totalRow = page.locator('#accountTable tfoot tr');
  }

  async open() {
    await this.goto('overview.htm');
    await this.waitForPageLoad();
  }

  async getAccountNumbers() {
    const links = await this.accountLinks.all();
    const numbers = [];
    for (const link of links) {
      numbers.push((await link.textContent())?.trim());
    }
    return numbers;
  }

  async getAccountCount() {
    return this.accountRows.count();
  }

  async getBalanceForRow(rowIndex) {
    const row = this.accountRows.nth(rowIndex);
    const balanceCell = row.locator('td').nth(1);
    return (await balanceCell.textContent())?.trim();
  }

  async openAccountDetails(accountNumber) {
    await this.page.locator(`#accountTable a:text("${accountNumber}")`).click();
  }
}

module.exports = { AccountsOverviewPage };
