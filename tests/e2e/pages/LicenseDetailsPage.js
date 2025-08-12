class LicenseDetailsPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }
  async assertOnPage() {
    await this.page.waitForURL(/\/license-details$/);
  }
  async fill(details) {
    const p = this.page;
    // Select licence type and premises type using stable IDs
    await p.locator('#license-type-premises').check();
    await p.locator('#premises-type-off-licence').check();
    await p.getByLabel('Address line 1', { exact: true }).fill(details.premisesAddressLine1);
    await p.getByLabel('Town or city', { exact: true }).fill(details.premisesAddressTown);
    await p.getByLabel('Postcode', { exact: true }).fill(details.premisesAddressPostcode);
    await p.getByLabel('Sale of alcohol for consumption on the premises').check();
  }
  async continue() {
    await this.page.getByRole('button', { name: 'Continue' }).click();
  }
}
module.exports = { LicenseDetailsPage };
