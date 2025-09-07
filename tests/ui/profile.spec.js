import{test,expect} from '@playwright/test'
import { ProfilePage } from '../../src/pages/ProfilePage'
import { RegisterPage } from '../../src/pages/RegisterPage';
import * as allure from "allure-js-commons";
const { insertUsers, generateTestUser,registerUserViaUI,updateUserFirstName,updatedPassword} = require('../../src/utils/dbHelper');


test.describe("Profile tests",()=>{
    let profile
    let registerPage
    let testUser;
    test.beforeEach(async({page})=>{
        allure.epic("User managment")
        allure.feature("Registration")
        
        profile = new ProfilePage(page)
        registerPage = new RegisterPage(page)

        testUser = await generateTestUser()
        await insertUsers(testUser)
        await registerUserViaUI(page, testUser, registerPage);
        await profile.goMainPage()
        await profile.logIntoDetails(testUser.username,testUser.password)
        await profile.logInto()
        


    })
test("Update First Name persists after refresh",async({page})=>{
    allure.severity('normal')
    allure.story('User updates first name and it is validated');
    allure.tag("positive")

    await profile.goProfile()
    const newFirstName = "UpdatedName";

    await profile.basicDetails(newFirstName)
    await updateUserFirstName(testUser.username,newFirstName)

    await expect(profile.successAlert.first()).toContainText("The profile has been saved successful");

    await page.reload()

    const greetingAfter = await profile.userLinkText();
    await expect(greetingAfter).toContain(newFirstName)

})

test("Update Password functionality correctly functions",async({page})=>{
    allure.severity('critical')
    allure.story('User updates password and can login with new credentials');
    allure.tag("positive")

    await profile.goProfile()
    const newPassword = "UpdatedPasswordTest";
    await profile.additionalPassword(testUser.password,newPassword)

    await profile.logout()

    await profile.goMainPage();
    await profile.logIntoDetails(testUser.username,newPassword);
    await profile.logInto();
    await expect(profile.errorAlert).toBeVisible()
    await expect(profile.errorAlert).toContainText("Invalid username/password");
    

    await profile.logIntoDetails(testUser.username,testUser.password);
    await profile.logInto();
    await expect(profile.logoutButton).toBeVisible()
    await updatedPassword(testUser.password,newPassword)

})
})