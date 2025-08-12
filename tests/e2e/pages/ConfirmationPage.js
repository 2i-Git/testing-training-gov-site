class ConfirmationPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }
  async assertSubmitted() {
    await this.page.waitForURL(/\/confirmation$/);
    await this.page.getByRole('heading', { name: 'Application submitted' }).waitFor();
  }
}
module.exports = { ConfirmationPage };
