class AdminLoginPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }
  async goto() {
    await this.page.goto('/admin/login');
  }
  async login(email, password) {
    await this.page.getByLabel('Email address').fill(email);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'Sign in' }).click();
  }
}
module.exports = { AdminLoginPage };
