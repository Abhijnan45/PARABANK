const { BasePage } = require('./BasePage');

/**
 * LoginPage — ParaBank customer login (index.htm)
 */
class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.usernameInput = page.locator('input[name="username"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.locator('input[type="submit"][value="Log In"]');
    this.registerLink = page.locator('a[href="register.htm"]');
    this.forgotLoginLink = page.locator('a[href="lookup.htm"]');
    this.errorMessage = page.locator('.error, #rightPanel p.error');
  }

  async open() {
    await this.goto('/index.htm');
    await this.waitForPageLoad();
  }

  async login(username, password) {
    await this.safeFill(this.usernameInput, username);
    await this.safeFill(this.passwordInput, password);
    await this.safeClick(this.loginButton);
  }

  async goToRegister() {
    await this.safeClick(this.registerLink);
  }

  async goToForgotLogin() {
    await this.safeClick(this.forgotLoginLink);
  }

  async getErrorMessage() {
    return this.getText(this.errorMessage);
  }

  async isLoginFormVisible() {
    return this.isVisible(this.usernameInput);
  }
}

module.exports = { LoginPage };
