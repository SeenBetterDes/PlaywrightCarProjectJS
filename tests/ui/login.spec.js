import { test, expect, chromium } from '@playwright/test'
import { LoginPage } from '../../src/pages/LoginPage'
import { RegisterPage } from '../../src/pages/RegisterPage';
import * as allure from "allure-js-commons";
const { insertUsers, generateTestUser, getLatestUser, registerUserViaUI } = require('../../src/utils/dbHelper');


test.describe("Login tests", () => {
  let login
  let registerPage
  test.beforeEach(async ({ page }) => {
    allure.epic('User Management');
    allure.feature('Login');

    login = new LoginPage(page)
    registerPage = new RegisterPage(page)
  })

  test('Valid Login with Registered User', async ({ page }) => {
    allure.severity('blocker');
    allure.story('Registered user can login successfully');
    allure.tag('positive');

    const testUser = await generateTestUser()
    await insertUsers(testUser)
    await registerUserViaUI(page, testUser, registerPage);

    await login.goMainPage()
    await login.logIntoDetails(testUser.username, testUser.password)
    await login.logInto()
    const nameLocator = await login.checkNavBarName();

    await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible()
    await expect(nameLocator).toHaveValue(testUser.first_name)
  })

  test('Login fails with invalid credentials - Username', async ({ page }) => {
    allure.severity('critical');
    allure.story('Login fails if username is invalid');
    allure.tag('negative');

    await login.goMainPage()
    await login.logIntoDetails("testuserplaywrightt", "Testuser12$")
    await login.logInto()

    await expect(login.errorAlert).toBeVisible()
    await expect(login.errorAlert).toContainText("Invalid username/password");
  })

  test("Login fails with invalid credentials - Password", async ({ page }) => {
    allure.severity('critical');
    allure.story('Login fails if password is invalid');
    allure.tag('negative');

    await login.goMainPage()
    await login.logIntoDetails("testuserplaywright", "Testuser12$$")
    await login.logInto()

    await expect(login.errorAlert).toBeVisible()
    await expect(login.errorAlert).toContainText("Invalid username/password");
  })

  test("Empty credentials prevent login", async ({ page }) => {
    allure.severity('normal');
    allure.story('Login form prevents submission when fields are empty');
    allure.tag('negative');

    const Cases = [{
      username: 'username',
      password: '',
      expectedField: 'password'
    },
    {
      username: '',
      password: 'password',
      expectedField: 'username'

    }, {
      username: '',
      password: '',
      expectedField: 'username'
    }];
    for (const { username, password, expectedField } of Cases) {
      await login.goMainPage()
      await login.logIntoDetails(
        username === 'username' ? 'testuserplaywright' : username,
        password === 'password' ? 'Testuser12$' : password
      );
      await login.logInto()

      if (expectedField == 'username') {
        const msg = await login.loginField.evaluate(el => el.validationMessage);
        expect(msg).toBe('Please fill out this field.');
      }

      if (expectedField == 'password') {
        const msg = await login.password.evaluate(el => el.validationMessage);
        expect(msg).toBe('Please fill out this field.');
      }

    }

  })

  test('Session persistence', async () => {
    allure.severity('normal');
    allure.story('Login session persists across browser restarts');
    allure.tag('positive');

    const isCI = process.env.CI === 'true';
    const userDataDir = './tmp/test-profile';
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: isCI
    });
    const page = await context.newPage();
    const login = new LoginPage(page)

    await login.goMainPage()
    await login.logIntoDetails("testuserplaywright", "Testuser12$")
    await login.logInto()


    await expect(login.logoutButton).toBeVisible();

    await context.close()

    const newContext = await chromium.launchPersistentContext(userDataDir, {
      headless: isCI
    });
    const newPage = await newContext.newPage();
    const newLogin = new LoginPage(newPage)

    await newLogin.goMainPage()

    await expect(newPage.getByRole('link', { name: 'Logout' })).toBeVisible();

    await newContext.close();
  })

  test("Logout functionality", async ({ page }) => {
    allure.severity('critical');
    allure.story('User can logout and session is cleared');
    allure.tag('positive');

    await login.goMainPage()
    await login.logIntoDetails("testuserplaywright", "Testuser12$")
    await login.logInto()
    await expect(login.logoutButton).toBeVisible();
    const storageBefore = await page.evaluate(() => ({
      local: { ...localStorage },
      session: { ...sessionStorage }
    }));
    console.log("Storage after login:", storageBefore);

    await login.logoutButton.click()
    await expect(login.loginButton).toBeVisible();

    const storageAfter = await page.evaluate(() => ({
      local: { ...localStorage },
      session: { ...sessionStorage }
    }));
    console.log("Storage after logout:", storageAfter);

    expect(JSON.stringify(storageAfter)).not.toContain("token");
  })

  test('Access control for Profile page without login', async ({ page }) => {
    allure.severity('critical');
    allure.story('Profile page is protected from unauthorized access');
    allure.tag('negative');

    await login.navigateProfile();
    await expect(page).toHaveURL("https://buggy.justtestit.org/");
    await expect(login.loginButton).toBeVisible();
  });

  test("Brute force protection (multiple failed attempts)", async ({ page }) => {
    allure.severity('blocker');
    allure.story('Login prevents multiple failed attempts');
    allure.tag('security');
    let logTime = 5;
    await login.goMainPage()
    for (let i = 0; i < logTime; i++) {
      await login.logIntoDetails("testuserplaywrightt", "Testuser12$$")
      await login.logInto()
      await expect(login.errorAlert).toBeVisible()
      await expect(login.errorAlert).toContainText("Invalid username/password");
    }

  })
  test('Case Sensitivity in Credentials', async ({ page }) => {
    allure.severity('normal');
    allure.story('Login fails if username/password case does not match');
    allure.tag('negative');

    const Cases = [{
      username: 'TESTUSERPLAYWRIGHT',
      password: 'Testuser12$'
    },
    {
      username: 'testuserplaywright',
      password: 'TESTUSER12$'
    }];

    for (const { username, password } of Cases) {
      await login.goMainPage()
      await login.logIntoDetails(username, password)
      await login.logInto()

      await expect(login.errorAlert).toBeVisible();
      await expect(login.errorAlert).toContainText("Invalid username/password");
    }

  })



  test('Login Functionality with Cookies (Remember Me Simulation)', async () => {
    allure.severity('critical');
    allure.story('User session persists using cookies/local storage');
    allure.tag('positive');

    const isCI = process.env.CI === 'true';
    const userDataDir = './tmp/test-profile'
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: isCI,
    });
    const page = await context.newPage();
    await login.goMainPage()
    await login.logIntoDetails("testuserplaywright", "Testuser12$")
    await login.logInto()

    await context.close();

    const newContext = await chromium.launchPersistentContext(userDataDir, { headless: isCI });
    const newP = await newContext.newPage()
    await newP.goto("https://buggy.justtestit.org/")
    await expect(newP.getByRole('link', { name: 'Logout' })).toBeVisible();
    await newContext.close();

  });
})
