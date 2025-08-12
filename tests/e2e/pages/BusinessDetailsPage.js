class BusinessDetailsPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }
  async assertOnPage() {
    await this.page.waitForURL(/\/business-details$/);
  }
  async fill(details) {
    const p = this.page;
    await p.getByLabel('Business name').fill(details.businessName);
    await p.getByLabel('Company registration number (optional)').fill(details.companyNumber);
    // Select business type "Shop/Off-licence"
    await p.locator('#business-type-shop').check();
    await p.getByLabel('Address line 1', { exact: true }).fill(details.businessAddressLine1);
    await p.getByLabel('Town or city', { exact: true }).fill(details.businessAddressTown);
    await p.getByLabel('Postcode', { exact: true }).fill(details.businessAddressPostcode);
    await p.getByLabel('Business phone number').fill(details.businessPhone);
    await p.getByLabel('Business email address (optional)').fill(details.businessEmail);
  }
  async continue() {
    await this.page.getByRole('button', { name: 'Continue' }).click();
  }
}
module.exports = { BusinessDetailsPage };
