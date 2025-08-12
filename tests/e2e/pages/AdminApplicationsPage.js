class AdminApplicationsPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }
  async assertOnPage() {
    await this.page.waitForURL(/\/admin\/applications/);
  }
  rowForApplicant(fullName) {
    return this.page.locator('tr', { hasText: fullName });
  }
  async acceptApplicant(fullName) {
    const row = this.rowForApplicant(fullName);
    await row.waitFor();
    await row.getByRole('button', { name: 'Accept' }).click();
  }
  async expectApproved(fullName) {
    const row = this.rowForApplicant(fullName);
    await row.getByText('Approved').waitFor();
  }
}
module.exports = { AdminApplicationsPage };
