const { test, expect } = require('@playwright/test');
const { LoginPage } = require('./pages/LoginPage');
const { PersonalDetailsPage } = require('./pages/PersonalDetailsPage');
const { BusinessDetailsPage } = require('./pages/BusinessDetailsPage');
const { LicenseDetailsPage } = require('./pages/LicenseDetailsPage');
const { SummaryPage } = require('./pages/SummaryPage');
const { ConfirmationPage } = require('./pages/ConfirmationPage');
const { AdminLoginPage } = require('./pages/AdminLoginPage');
const { AdminApplicationsPage } = require('./pages/AdminApplicationsPage');

test('user submits app and admin accepts it', async ({ page }) => {
  const uniq = Date.now().toString();
  const toAlpha = s => s.replace(/\d/g, d => String.fromCharCode(97 + Number(d)));
  const firstName = 'John';
  const lastName = `EZE ${toAlpha(uniq)}`; // avoid digits in name
  const fullName = `${firstName} ${lastName}`;

  // User login
  const login = new LoginPage(page);
  await login.goto();
  await login.login('user@example.com', 'password123');
  console.log('✅ User login complete');

  // Personal details
  const pd = new PersonalDetailsPage(page);
  await pd.assertOnPage();
  await pd.fill({
    firstName,
    lastName,
    dobDay: '10',
    dobMonth: '5',
    dobYear: '2000',
    email: `john.${uniq}@example.com`,
    phoneNumber: '07123456789',
    addressLine1: '1 Test St',
    addressTown: 'Town',
    addressPostcode: 'SW1A 1AA'
  });
  await pd.continue();
  console.log('✅ Personal details submitted');

  // Business details
  const bd = new BusinessDetailsPage(page);
  await bd.assertOnPage();
  await bd.fill({
    businessName: 'Biz Ltd',
    companyNumber: '01234567',
    businessAddressLine1: '2 Biz St',
    businessAddressTown: 'Biztown',
    businessAddressPostcode: 'EC1A 1BB',
    businessPhone: '02070000000',
    businessEmail: `info.${uniq}@biz.com`
  });
  await bd.continue();
  console.log('✅ Business details submitted');

  // Licence details
  const ld = new LicenseDetailsPage(page);
  await ld.assertOnPage();
  await ld.fill({
    premisesAddressLine1: '3 Prem Rd',
    premisesAddressTown: 'Premcity',
    premisesAddressPostcode: 'W1A 0AX'
  });
  await ld.continue();
  console.log('✅ Licence details submitted');

  // Summary + submit
  const summary = new SummaryPage(page);
  await summary.assertOnPage?.();
  await summary.submit();
  console.log('✅ Application summary submitted');

  // Confirmation
  const conf = new ConfirmationPage(page);
  await conf.assertSubmitted();
  console.log('✅ Application confirmation page reached');

  // Admin flow
  const adminLogin = new AdminLoginPage(page);
  await adminLogin.goto();
  await adminLogin.login('admin@example.com', 'admin123');
  console.log('✅ Admin login complete');

  const adminApps = new AdminApplicationsPage(page);
  await adminApps.assertOnPage();
  await adminApps.acceptApplicant(fullName);
  console.log('✅ Admin accepted applicant');

  // Success banner and approved status
  await expect(page).toHaveURL(/\/admin\/applications\?success=/);
  await page.getByText('Application approved successfully').waitFor();
  await adminApps.expectApproved(fullName);
  console.log('✅ Application approved and success banner shown');
});
