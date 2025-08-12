class PersonalDetailsPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }
  async assertOnPage() {
    await this.page.waitForURL(/\/personal-details$/);
  }
  async fill(details) {
    const p = this.page;
    await p.getByLabel('First name').fill(details.firstName);
    await p.getByLabel('Last name').fill(details.lastName);
    await p.getByLabel('Day').fill(details.dobDay);
    await p.getByLabel('Month').fill(details.dobMonth);
    await p.getByLabel('Year').fill(details.dobYear);
    await p.getByLabel('Email address').fill(details.email);
    await p.getByLabel('Phone number').fill(details.phoneNumber);
    await p.getByLabel('Address line 1').fill(details.addressLine1);
    await p.getByLabel('Town or city').fill(details.addressTown);
    await p.getByLabel('Postcode').fill(details.addressPostcode);
  }
  async continue() {
    await this.page.getByRole('button', { name: 'Continue' }).click();
  }
}

module.exports = { PersonalDetailsPage };
