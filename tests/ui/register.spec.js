import {test,expect} from '@playwright/test'
import { RegisterPage} from '../../src/pages/RegisterPage'
import * as allure from "allure-js-commons";
const { insertUsers, generateTestUser,getLatestUser,registerUserViaUI,userExists} = require('../../src/utils/dbHelper');

test.describe('Registration tests',()=>{
    let registerPage;
    test.beforeEach(async({page})=>{
        allure.epic("User managment")
        allure.feature("Registration")

        registerPage = new RegisterPage(page);
        await registerPage.goMainPage();
        await registerPage.goRegisterPage();
    })


test('Valid Login',async({page})=>{
    allure.severity('blocker')
    allure.story('User can register successfully');
    allure.tag("positive")
    const testUser = await generateTestUser()
    await registerUserViaUI(page, testUser, registerPage);
    
    await expect(registerPage.successAlert).toContainText("Registration is successful")
    await insertUsers(testUser)
    await registerPage.goBackHome();
})



test('Register with existing username',async({page})=>{ 
    allure.severity('critical')
    allure.story('User cannot register with existing username');
    allure.tag("negative")
    const testUser = await getLatestUser()
    await registerUserViaUI(page, testUser, registerPage);
    
    await expect(registerPage.errorAlert).toContainText("User already exists")
})


test('Register with unmatching password',async({page})=>{
    allure.severity('critical')
    allure.story('User enters mismatched passwords');
    allure.tag("negative")

    const timeStamp = Date.now()
    const testUser = {
       username: `testuser_${timeStamp}`,
       firstName: "Test",
       lastName: "User",
       password: `Password!_${timeStamp}!`,
       confirmPassword: `Password!!_${timeStamp}!`

    };
    
    await registerPage.registerValidUser(
        testUser.username,
        testUser.firstName,
        testUser.lastName,
        testUser.password,
        testUser.confirmPassword
    );

    await expect(registerPage.registerButton).toBeDisabled();
})


test('Register with a short password',async({page})=>{
    allure.severity('critical')
    allure.story('User enters too short of a password');
    allure.tag("negative")

    const timeStamp = Date.now()
    const testUser = {
       username: `testuser_${timeStamp}`,
       firstName: "Test",
       lastName: "User",
       password: `Pass`,
       confirmPassword: `Pass`
    };
    await registerPage.registerValidUser(
        testUser.username,
        testUser.firstName,
        testUser.lastName,
        testUser.password,
        testUser.confirmPassword
    );
    await expect(registerPage.errorAlert).toContainText("minimum field size of 6")
})

test('Registration fails when password missing required character types',async({page})=>{
    allure.severity('critical')
    allure.story('Password missing required character types');
    allure.tag("negative")

    const passwordCases = [
  {
    password: 'password',
    expectedError: 'Password must have uppercase characters'
  },
  {
    password: 'PASSWORD',
    expectedError: 'Password must have lowercase characters'
  },
  {
    password: '!@#$%^&*',
    expectedError: 'Password must '
  }
];
     for (const { password, expectedError } of passwordCases) {
        const timeStamp = Date.now()
        const testUser = {
           username: `testuser_${timeStamp}`,
           firstName: "Test",
           lastName: "User",
           password: password,
           confirmPassword: password
    };
        await registerPage.registerValidUser(
           testUser.username,
           testUser.firstName,
           testUser.lastName,
           testUser.password,
           testUser.confirmPassword
    );
        await expect(registerPage.errorAlert).toContainText(expectedError)
     }
})


test('Register with max length password',async({page})=>{
    allure.severity('minor')
    allure.story('User enters too long of a password');
    allure.tag("negative")

    const timeStamp = Date.now()
    const longPassword = "1".repeat(51);
    const testUser = {
       username: `testuser_${timeStamp}`,
       firstName: "Test",
       lastName: "User",
       password: longPassword,
       confirmPassword: longPassword
    };
    await registerPage.registerValidUser(
        testUser.username,
        testUser.firstName,
        testUser.lastName,
        testUser.password,
        testUser.confirmPassword
    );
    await expect(registerPage.errorAlert).toContainText("too long")
})

test("Register with max length username",async({page})=>{
    allure.severity('minor')
    allure.story('User enters too long of a username');
    allure.tag("negative")

    const timeStamp = Date.now()
    const longUser = "1".repeat(51);
    const testUser = {
       username: longUser,
       firstName: "Test",
       lastName: "User",
       password: `Password!!_${timeStamp}!`,
       confirmPassword: `Password!!_${timeStamp}!`
    };
    await registerPage.registerValidUser(
        testUser.username,
        testUser.firstName,
        testUser.lastName,
        testUser.password,
        testUser.confirmPassword
    );
    await expect(registerPage.registerButton).toBeDisabled();
})

test("Register button disabled until all mandatory fields are filled",async({page})=>{
    allure.severity('minor')
    allure.story('Register button requires all mandatory fields');
    allure.tag("negative")

    const testUser = {
       username: "UserDemo",
       firstName: "",
       lastName: "",
       password: "Admin123$",
       confirmPassword: "Admin123$"
    };
    await registerPage.registerValidUser(
        testUser.username,
        testUser.firstName,
        testUser.lastName,
        testUser.password,
        testUser.confirmPassword
    );
    await expect(registerPage.registerButton).toBeDisabled();
})

})