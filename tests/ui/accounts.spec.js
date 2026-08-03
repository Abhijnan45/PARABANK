const { test, expect } = require('../../fixtures/authFixtures');

test.describe('ParaBank Accounts Overview', () => {
  test('newly registered customer has exactly one default account @smoke @crud', async ({
    newCustomer,
  }) => {
    expect(newCustomer.defaultAccountNumber).toBeTruthy();
    expect(newCustomer.defaultAccountNumber).toMatch(/^\d+$/);
  });

  test('overview page lists the default account with a numeric balance @smoke', async ({
    newCustomer,
    accountsOverviewPage,
  }) => {
    await accountsOverviewPage.open();
    const count = await accountsOverviewPage.getAccountCount();
    expect(count).toBeGreaterThanOrEqual(1);
    const balance = await accountsOverviewPage.getBalanceForRow(0);
    expect(balance).toMatch(/\$?[\d,]+\.\d{2}/);
  });

  test('account count increases by one after opening a new account @regression @crud', async ({
    newCustomer,
    accountsOverviewPage,
    openAccountPage,
  }) => {
    await accountsOverviewPage.open();
    const before = await accountsOverviewPage.getAccountCount();

    await openAccountPage.open();
    await openAccountPage.openNewAccount('SAVINGS');
    await expect(openAccountPage.resultPanel).toBeVisible();

    await accountsOverviewPage.open();
    const after = await accountsOverviewPage.getAccountCount();
    expect(after).toBe(before + 1);
  });

  test('clicking an account number navigates to its activity page @regression', async ({
    newCustomer,
    accountsOverviewPage,
    page,
  }) => {
    await accountsOverviewPage.open();
    await accountsOverviewPage.openAccountDetails(newCustomer.defaultAccountNumber);
    await expect(page).toHaveURL(/activity\.htm/);
  });
});
