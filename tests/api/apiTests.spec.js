import { test, expect } from '@playwright/test'
import { registerUserViaUI, generateTestUser } from '../../src/utils/dbHelper';
import { HomePage } from '../../src/pages/homePage';
import { RegisterPage } from '../../src/pages/RegisterPage';
import * as allure from "allure-js-commons";

test.describe("API tests", () => {
  let testUser;

  test.beforeEach("generate dummy user", async ({ page }) => {
    allure.epic("User managment")
    allure.feature("API")
    
    const home = new HomePage(page);
    const registerPage = new RegisterPage(page)
    testUser = await generateTestUser();
    await registerUserViaUI(page, testUser, registerPage);
    await home.goMainPage()
    await home.logIntoDetails(testUser.username, testUser.password)
    await home.goToCarsOptions()
    await home.goSpecificCar()
  })

  test("Login with valid user", async ({ request }) => {
    allure.severity('blocker');
    allure.story('User can log in via API successfully');
    allure.tag('api');
    allure.tag('auth');

    const response = await request.post(
      'https://k51qryqov3.execute-api.ap-southeast-2.amazonaws.com/prod/oauth/token', {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },

      form: {
        grant_type: 'password',
        username: testUser.username,
        password: testUser.password
      },
    }
    )

    expect(response.status()).toBe(200);


    const body = await response.json();
    expect(body).toHaveProperty('access_token');
    expect(body).toHaveProperty('token_type', 'Bearer');
  })

  test("Login with invalid user", async ({ request }) => {
    allure.severity('critical');
    allure.story('Login fails with wrong credentials');
    allure.tag('api');
    allure.tag('auth');
    allure.tag('negative');

    const response = await request.post(
      'https://k51qryqov3.execute-api.ap-southeast-2.amazonaws.com/prod/oauth/token', {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },

      form: {
        grant_type: 'password',
        username: 'TestUser',
        password: 'TestUserDemo$'
      },
    }
    )

    expect(response.status()).toBe(401)
    const body = await response.text()
    expect(body).toContain("Invalid credentials")
  })

  test("Get current user", async ({ request }) => {
    allure.severity('normal');
    allure.story('Fetch current user info with valid token');
    allure.tag('api');
    allure.tag('auth');

    const loginResponse = await request.post(
      'https://k51qryqov3.execute-api.ap-southeast-2.amazonaws.com/prod/oauth/token', {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },

      form: {
        grant_type: 'password',
        username: testUser.username,
        password: testUser.password
      },
    }
    )

    expect(loginResponse.status()).toBe(200)
    const loginBody = await loginResponse.json();
    const token = loginBody.access_token;
    expect(token).toBeTruthy();

    const responseUser = await request.get(
      'https://k51qryqov3.execute-api.ap-southeast-2.amazonaws.com/prod/users/current', {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    }
    )

    expect(responseUser.status()).toBe(200);
    const userBody = await responseUser.json()
    expect(userBody).toHaveProperty('firstName');
    expect(userBody).toHaveProperty('lastName');
    expect(userBody).toHaveProperty('isAdmin');

  })


  test('Vote for a car', async ({ request }) => {
    allure.severity('critical');
    allure.story('User can vote for a car via API');
    allure.tag('api');
    allure.tag('positive');
    const loginResponse = await request.post(
      'https://k51qryqov3.execute-api.ap-southeast-2.amazonaws.com/prod/oauth/token',
      {
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        form: {
          grant_type: 'password',
          username: testUser.username,
          password: testUser.password,
        },
      }
    );

    expect(loginResponse.status()).toBe(200);
    const { access_token } = await loginResponse.json();
    expect(access_token).toBeTruthy();


    const carId = 'ckl2phsabijs71623vk0|ckl2phsabijs71623vqg';
    const voteResponse = await request.post(
      `https://k51qryqov3.execute-api.ap-southeast-2.amazonaws.com/prod/models/${encodeURIComponent(carId)}/vote`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        data: { comment: '' },
      }
    );


    expect(voteResponse.status()).toBe(200);
  });

  test("Get car Details", async ({ request }) => {
    allure.severity('normal');
    allure.story('Retrieve car details via API');
    allure.tag('api');

    const loginResponse = await request.post(
      'https://k51qryqov3.execute-api.ap-southeast-2.amazonaws.com/prod/oauth/token',
      {
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        form: {
          grant_type: 'password',
          username: testUser.username,
          password: testUser.password,
        },
      }
    );
    expect(loginResponse.status()).toBe(200);
    const { access_token } = await loginResponse.json();
    expect(access_token).toBeTruthy();

    const carId = 'ckl2phsabijs71623vk0|ckl2phsabijs71623vqg';
    const carResponse = await request.get(
      `https://k51qryqov3.execute-api.ap-southeast-2.amazonaws.com/prod/models/${encodeURIComponent(carId)}`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    expect(carResponse.status()).toBe(200);
  })

  test("Vote for a car with a comment", async ({ request }) => {
    allure.severity('critical');
    allure.story('User can vote with a comment');
    allure.tag('api');
    allure.tag('vote');
    allure.tag('positive');

    const loginResponse = await request.post(
      'https://k51qryqov3.execute-api.ap-southeast-2.amazonaws.com/prod/oauth/token',
      {
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        form: {
          grant_type: 'password',
          username: testUser.username,
          password: testUser.password,
        },
      }
    );

    expect(loginResponse.status()).toBe(200);
    const { access_token } = await loginResponse.json();
    expect(access_token).toBeTruthy();

    const carId = 'ckl2phsabijs71623vk0|ckl2phsabijs71623vqg';
    const voteResponse = await request.post(
      `https://k51qryqov3.execute-api.ap-southeast-2.amazonaws.com/prod/models/${encodeURIComponent(carId)}/vote`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        data: { comment: 'TESTDEMO' },
      }
    );
    expect(voteResponse.status()).toBe(200);

    const carDetails = await request.get(
      `https://k51qryqov3.execute-api.ap-southeast-2.amazonaws.com/prod/models/${encodeURIComponent(carId)}`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    const carBody = await carDetails.json();



    const comments = carBody.comments.map(c => c.text);
    expect(comments).toContain('TESTDEMO');
  });

})
