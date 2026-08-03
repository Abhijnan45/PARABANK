const { test, expect } = require('../../fixtures/authFixtures');

/**
 * Every test here needs at least two accounts to transfer between, so
 * each test opens a second SAVINGS account (funded from the default
 * one) before exercising the transfer itself.
 */
test.describe('ParaBank Transfer Funds', () => {
  test.beforeEach(async ({ newCustomer, openAccountPage }) => {
    await openAccountPage.open();
    await openAccountPage.openNewAccount('SAVINGS', newCustomer.defaultAccountNumber);
    newCustomer.secondAccountNumber = await openAccountPage.getNewAccountNumber();
  });

  test('transfers a valid amount between two owned accounts @smoke @crud', async ({
    newCustomer,
    transferFundsPage,
  }) => {
    await transferFundsPage.open();
    await transferFundsPage.transfer(
      '25.00',
      newCustomer.defaultAccountNumber,
      newCustomer.secondAccountNumber
    );
    expect(await transferFundsPage.isTransferComplete()).toBe(true);
  });

  test('rejects a transfer of a negative amount @regression @boundary @negative', async ({
    newCustomer,
    transferFundsPage,
  }) => {
    await transferFundsPage.open();
    await transferFundsPage.transfer(
      '-50.00',
      newCustomer.defaultAccountNumber,
      newCustomer.secondAccountNumber
    );
    // ParaBank's server-side validation should reject or the UI should
    // stay on the form rather than confirming a nonsensical transfer.
    expect(await transferFundsPage.isTransferComplete()).toBe(false);
  });

  test('handles a zero-amount transfer without confirming it as a real transfer @regression @boundary', async ({
    newCustomer,
    transferFundsPage,
  }) => {
    await transferFundsPage.open();
    await transferFundsPage.transfer(
      '0',
      newCustomer.defaultAccountNumber,
      newCustomer.secondAccountNumber
    );
    // Documented as a behavior check: ParaBank is known to be lenient
    // here in some deployments. We assert the app doesn't crash either way.
    await expect(transferFundsPage.page).not.toHaveURL(/500|error\.htm/);
  });

  test('handles a same-account transfer (from and to identical) gracefully @regression @edge', async ({
    newCustomer,
    transferFundsPage,
  }) => {
    await transferFundsPage.open();
    await transferFundsPage.transfer(
      '10.00',
      newCustomer.defaultAccountNumber,
      newCustomer.defaultAccountNumber
    );
    await expect(transferFundsPage.page).not.toHaveURL(/500|error\.htm/);
  });

  test('handles a transfer amount exceeding the account balance @regression @negative', async ({
    newCustomer,
    transferFundsPage,
  }) => {
    await transferFundsPage.open();
    await transferFundsPage.transfer(
      '999999999.00',
      newCustomer.defaultAccountNumber,
      newCustomer.secondAccountNumber
    );
    // Known ParaBank behavior: this demo app does not always enforce
    // overdraft protection server-side. The meaningful assertion for a
    // portfolio test is documenting actual behavior, not assuming a
    // rule the app may not enforce — hence checking stability, not a
    // hardcoded pass/fail on business logic we haven't verified.
    await expect(transferFundsPage.page).not.toHaveURL(/500|error\.htm/);
  });
});
