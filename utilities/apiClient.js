/**
 * apiClient
 *
 * Thin wrapper around Playwright's APIRequestContext for ParaBank's
 * REST services (base: /parabank/services/bank).
 *
 * IMPORTANT — a note on confidence level, unlike the UI locators:
 * ParaBank's JSP pages have been visually and structurally stable for
 * ~15 years, so the UI locators in `pages/` are high-confidence.
 * The REST contract below is reconstructed from Parasoft's own
 * ParaBankService source and the widely-used public Postman
 * collection for this app — but if any call here returns an
 * unexpected 404/400, cross-check the live contract yourself before
 * assuming the test (rather than the endpoint) is wrong:
 *
 *   https://parabank.parasoft.com/parabank/services/bank?_wadl&_type=xml
 *
 * This client always requests `Accept: application/json` since the
 * default WADL response type is XML.
 */

const JSON_HEADERS = { Accept: 'application/json', 'Content-Type': 'application/json' };

class ApiClient {
  /**
   * @param {import('@playwright/test').APIRequestContext} request
   */
  constructor(request) {
    this.request = request;
  }

  /** GET /login/{username}/{password} -> Customer JSON (includes `id`) on success */
  async login(username, password) {
    return this.request.get(`/login/${encodeURIComponent(username)}/${encodeURIComponent(password)}`, {
      headers: JSON_HEADERS,
    });
  }

  /** GET /customers/{customerId} -> Customer JSON */
  async getCustomer(customerId) {
    return this.request.get(`/customers/${customerId}`, { headers: JSON_HEADERS });
  }

  /** GET /customers/{customerId}/accounts -> Account[] */
  async getAccountsForCustomer(customerId) {
    return this.request.get(`/customers/${customerId}/accounts`, { headers: JSON_HEADERS });
  }

  /** GET /accounts/{accountId} -> Account */
  async getAccount(accountId) {
    return this.request.get(`/accounts/${accountId}`, { headers: JSON_HEADERS });
  }

  /** GET /accounts/{accountId}/transactions -> Transaction[] */
  async getTransactionsForAccount(accountId) {
    return this.request.get(`/accounts/${accountId}/transactions`, { headers: JSON_HEADERS });
  }

  /** GET /accounts/{accountId}/transactions/amount/{amount} -> Transaction[] */
  async findTransactionsByAmount(accountId, amount) {
    return this.request.get(`/accounts/${accountId}/transactions/amount/${amount}`, {
      headers: JSON_HEADERS,
    });
  }

  /** GET /transactions/{transactionId} -> Transaction */
  async findTransactionById(transactionId) {
    return this.request.get(`/transactions/${transactionId}`, { headers: JSON_HEADERS });
  }

  /** POST /transfer?fromAccountId=&toAccountId=&amount= */
  async transfer(fromAccountId, toAccountId, amount) {
    return this.request.post('/transfer', {
      headers: JSON_HEADERS,
      params: { fromAccountId, toAccountId, amount },
    });
  }

  /**
   * POST /accounts/{customerId}/{newAccountType}/{fromAccountId}
   * newAccountType: 0 = CHECKING, 1 = SAVINGS (ParaBank's own convention)
   */
  async createAccount(customerId, newAccountType, fromAccountId) {
    return this.request.post(`/accounts/${customerId}/${newAccountType}/${fromAccountId}`, {
      headers: JSON_HEADERS,
    });
  }

  /** POST /billpay?accountId= — body is the Payee JSON */
  async payBill(accountId, payee) {
    return this.request.post('/billpay', {
      headers: JSON_HEADERS,
      params: { accountId },
      data: payee,
    });
  }
}

module.exports = { ApiClient };
