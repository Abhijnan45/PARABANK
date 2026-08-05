const { BasePage } = require('./BasePage');

/**
 * RegistrationPage — ParaBank new-customer signup (register.htm)
 */
class RegistrationPage extends BasePage {
  constructor(page) {
    super(page);
    this.firstName = page.locator('#customer\\.firstName');
    this.lastName = page.locator('#customer\\.lastName');
    this.street = page.locator('#customer\\.address\\.street');
    this.city = page.locator('#customer\\.address\\.city');
    this.state = page.locator('#customer\\.address\\.state');
    this.zipCode = page.locator('#customer\\.address\\.zipCode');
    this.phoneNumber = page.locator('#customer\\.phoneNumber');
    this.ssn = page.locator('#customer\\.ssn');
    this.username = page.locator('#customer\\.username');
    this.password = page.locator('#customer\\.password');
    this.confirmPassword = page.locator('#repeatedPassword');
    this.registerButton = page.locator('input[type="submit"][value="Register"]');
    this.successMessage = page.locator('#rightPanel h1');
    this.fieldError = (fieldName) => page.locator(`#customer\\.${fieldName}\\.errors, #${fieldName}\\.errors`);
  }

  async open() {
    await this.goto('register.htm');
    await this.waitForPageLoad();
  }

  /**
   * Fills the registration form from a plain data object so callers
   * (and data-driven tests) can pass partial objects for negative
   * testing without every field needing to be specified.
   */
  async fillForm(data = {}) {
    const fieldMap = {
      firstName: this.firstName,
      lastName: this.lastName,
      street: this.street,
      city: this.city,
      state: this.state,
      zipCode: this.zipCode,
      phoneNumber: this.phoneNumber,
      ssn: this.ssn,
      username: this.username,
      password: this.password,
      confirmPassword: this.confirmPassword,
    };

    for (const [key, locator] of Object.entries(fieldMap)) {
      if (data[key] !== undefined) {
        await locator.fill(String(data[key]));
      }
    }
  }

  async submit() {
    await this.safeClick(this.registerButton);
  }

  async register(data) {
    await this.fillForm(data);
    await this.submit();
  }

  async getSuccessMessage() {
    return this.getText(this.successMessage);
  }
}

module.exports = { RegistrationPage };
