class SummaryPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }
  async assertOnPage() {
    await this.page.waitForURL(/\/summary$/);
  }
  async submit() {
    await this.page
      .getByLabel(
        'I confirm that the information I have provided is correct and I understand that providing false information may result in my application being refused.'
      )
      .check();
    await this.page.getByRole('button', { name: 'Submit application' }).click();
  }
}
module.exports = { SummaryPage };
