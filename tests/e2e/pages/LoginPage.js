class LoginPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.email = page.getByLabel('Email address');
    this.password = page.getByLabel('Password');
    this.signIn = page.getByRole('button', { name: 'Sign in' });
  }
  async goto() {
    await this.page.goto('/login');
  }
  async login(email, password) {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.signIn.click();
  }
}

module.exports = { LoginPage };
