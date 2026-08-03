const { test, expect } = require('../../fixtures/authFixtures');

test.describe('ParaBank Open New Account', () => {
  test('opens a new SAVINGS account funded from the default account @smoke @crud', async ({
    newCustomer,
    openAccountPage,
  }) => {
    await openAccountPage.open();
    await openAccountPage.openNewAccount('SAVINGS', newCustomer.defaultAccountNumber);
    const heading = await openAccountPage.getSuccessHeadingText();
    expect(heading).toMatch(/Account Opened/i);
    const newAccountNumber = await openAccountPage.getNewAccountNumber();
    expect(newAccountNumber).toMatch(/^\d+$/);
    expect(newAccountNumber).not.toBe(newCustomer.defaultAccountNumber);
  });

  test('opens a new CHECKING account funded from the default account @regression @crud', async ({
    newCustomer,
    openAccountPage,
  }) => {
    await openAccountPage.open();
    await openAccountPage.openNewAccount('CHECKING', newCustomer.defaultAccountNumber);
    const heading = await openAccountPage.getSuccessHeadingText();
    expect(heading).toMatch(/Account Opened/i);
  });

  test('each newly opened account receives a unique account number @regression', async ({
    newCustomer,
    openAccountPage,
  }) => {
    await openAccountPage.open();
    await openAccountPage.openNewAccount('SAVINGS', newCustomer.defaultAccountNumber);
    const first = await openAccountPage.getNewAccountNumber();

    await openAccountPage.open();
    await openAccountPage.openNewAccount('SAVINGS', newCustomer.defaultAccountNumber);
    const second = await openAccountPage.getNewAccountNumber();

    expect(first).not.toBe(second);
  });

  test('newly opened account appears in Accounts Overview immediately @regression @e2e', async ({
    newCustomer,
    openAccountPage,
    accountsOverviewPage,
  }) => {
    await openAccountPage.open();
    await openAccountPage.openNewAccount('SAVINGS', newCustomer.defaultAccountNumber);
    const newAccountNumber = await openAccountPage.getNewAccountNumber();

    await accountsOverviewPage.open();
    const accountNumbers = await accountsOverviewPage.getAccountNumbers();
    expect(accountNumbers).toContain(newAccountNumber);
  });
});
