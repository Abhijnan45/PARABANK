const { test, expect } = require('../../fixtures/authFixtures');

test.describe('ParaBank Find Transactions', () => {
  test.beforeEach(async ({ newCustomer, openAccountPage }) => {
    // Give the account a second account + at least one real transfer,
    // so there's an actual transaction to search for.
    await openAccountPage.open();
    await openAccountPage.openNewAccount('SAVINGS', newCustomer.defaultAccountNumber);
    newCustomer.secondAccountNumber = await openAccountPage.getNewAccountNumber();
  });

  test('finds a transaction by amount after a real transfer @smoke @search', async ({
    newCustomer,
    transferFundsPage,
    findTransactionsPage,
  }) => {
    await transferFundsPage.open();
    await transferFundsPage.transfer('42.00', newCustomer.defaultAccountNumber, newCustomer.secondAccountNumber);
    expect(await transferFundsPage.isTransferComplete()).toBe(true);

    await findTransactionsPage.open();
    await findTransactionsPage.findByAmount('42.00');
    expect(await findTransactionsPage.hasResults()).toBe(true);
  });

  test('returns no results for a transaction ID that does not exist @regression @negative', async ({
    findTransactionsPage,
  }) => {
    await findTransactionsPage.open();
    await findTransactionsPage.findByTransactionId('999999999');
    expect(await findTransactionsPage.hasResults()).toBe(false);
  });

  test('handles a non-numeric transaction ID without crashing @regression @boundary', async ({
    findTransactionsPage,
  }) => {
    await findTransactionsPage.open();
    await findTransactionsPage.findByTransactionId('abc123');
    await expect(findTransactionsPage.page).not.toHaveURL(/500|error\.htm/);
  });
});
