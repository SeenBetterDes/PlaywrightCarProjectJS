import {test,expect} from '@playwright/test'
import { RegisterPage} from '../../src/pages/RegisterPage'
import { ProfilePage } from '../../src/pages/ProfilePage';
import { HomePage } from '../../src/pages/homePage';
import * as allure from "allure-js-commons";
const { insertUsers, generateTestUser,getLatestUser,registerUserViaUI,deleteUser,userExists,countUsersByUsername, updatedPassword, updateUserFirstName,getLatestVote,vote,getVoteByUserAndComment,getUserByUsername} = require('../../src/utils/dbHelper');

test.describe("Database tests",()=>{
    let registerPage
    let profile
    let home
    test.beforeEach(async({page})=>{
        allure.epic('User Management');
        allure.feature('DB Integrity & Persistence');

        registerPage = new RegisterPage(page)
        profile = new ProfilePage(page)
        home = new HomePage(page)
    })

test("Registration succeeds with valid data",async({page})=>{
    allure.severity('blocker');
    allure.story('Valid registration persists in DB');
    allure.tag("database")

    const testUser = await generateTestUser()
    await registerUserViaUI(page,testUser,registerPage)

    await expect(registerPage.successAlert).toContainText("Registration is successful")
    await insertUsers(testUser)
    const latestUser = await getLatestUser()

    const timestamp = new Date(latestUser.created_at).getTime();
    const now = Date.now();
    expect(Math.abs(now - timestamp)).toBeLessThan(5000);

    await deleteUser(testUser.username)
})

test('Registration fails with SQL injection attempt',async({page})=>{
    allure.severity('critical');
    allure.story('SQL injection in username is prevented');
    allure.tag("database")
    allure.tag('security');

    const maliciousUser = {
    username: `admin'OR'1'='1_${Date.now()}`,
    first_name: "SQL",
    last_name: "Injection",
    password: "Hack123!",
  };
    await registerPage.goMainPage()
    await registerPage.goRegisterPage()
    await registerPage.registerValidUser(
        maliciousUser.username,
        maliciousUser.first_name,
        maliciousUser.last_name,
        maliciousUser.password,
        maliciousUser.password
    );
    const found = await userExists(maliciousUser.username);
    expect(found).toBeFalsy()

})


test('Registration fails when username violates DB constraints',async({page})=>{
    allure.severity('critical');
    allure.story('DB constraints prevent invalid usernames');
    allure.tag("database")
    allure.tag('negative');

    const timestamp = Date.now();
    const testUsernames = [
    ` SELECT_${timestamp}`,  
    ` admin_${timestamp} `,   
    ` NULL_${timestamp}`,     
];
    for(const uname of testUsernames){
        const maliciousUser = {
        username:uname,
        first_name: "SQL",
        last_name: "Injection",
        password: "Hack123!",
    };
    await registerPage.goMainPage()
    await registerPage.goRegisterPage()
    await registerPage.registerValidUser(
        maliciousUser.username,
        maliciousUser.first_name,
        maliciousUser.last_name,
        maliciousUser.password,
        maliciousUser.password
    );

    await expect(registerPage.errorAlert).toContainText("failed to satisfy constraint")
    const found = await userExists(maliciousUser.username);
    expect(found).toBeFalsy();
    }
    
})

test("Duplicate username constraint (edge case)",async({page})=>{
    allure.severity('critical');
    allure.story('DB prevents duplicate usernames');
    allure.tag("database")
    allure.tag('negative');

    const testUser = await generateTestUser()
    await registerUserViaUI(page,testUser,registerPage)

    await expect(registerPage.successAlert).toContainText("Registration is successful")
    await insertUsers(testUser)
    
    const LatestUser = await getLatestUser()
    await registerPage.goMainPage()
    await registerPage.goRegisterPage()

    await registerPage.registerValidUser(
        LatestUser.username,
        LatestUser.first_name,
        LatestUser.last_name,
        LatestUser.password,
        LatestUser.password
    );

    await expect(registerPage.errorAlert).toContainText("User already exists")

    const found = await countUsersByUsername(LatestUser.username)
    expect(found).toBe(1);
    await deleteUser(LatestUser.username)
})

test("Long input / boundary condition",async({page})=>{
    allure.severity('normal');
    allure.story('Long username/password disables registration');
    allure.tag("database")
    allure.tag('negative');

    const longUser = "1".repeat(51);
    const longPassword = "1".repeat(51);
    const testUser = {
       username: longUser,
       firstName: "Test",
       lastName: "User",
       password: longPassword,
       confirmPassword: longPassword
    };

    await registerPage.goMainPage()
    await registerPage.goRegisterPage()
    await registerPage.registerValidUser(
        testUser.username,
        testUser.firstName,
        testUser.lastName,
        testUser.password,
        testUser.confirmPassword
    );

    
    await expect(registerPage.registerButton).toBeDisabled();
    

    const foundInvalid = await userExists(testUser.username);
    expect(foundInvalid).toBeFalsy();
})

test("Password update persists in DB",async({page})=>{
    allure.severity('blocker');
    allure.story('User password update reflects in DB');
    allure.tag("database")
    allure.tag('positive');

    const testUser = await generateTestUser()
    await registerUserViaUI(page, testUser, registerPage);
    await insertUsers(testUser)
    
    await profile.goMainPage()
    await profile.logIntoDetails(testUser.username,testUser.password)
    await profile.logInto()
    await profile.goProfile()
    const newPassword = "UpdatedPasswordTest";
    await profile.additionalPassword(testUser.password,newPassword)

    await updatedPassword(testUser.password,newPassword)

    const updatedUser = await userExists(testUser.username);
    expect(updatedUser.password).toBe(newPassword)
})

test("Profile update persists in DB",async({page})=>{
    allure.severity('blocker');
    allure.story('User first name update reflects in DB');
    allure.tag("database")
    allure.tag('positive');

    const testUser = await generateTestUser()
    await registerUserViaUI(page, testUser, registerPage);
    await insertUsers(testUser)
    
    await profile.goMainPage()
    await profile.logIntoDetails(testUser.username,testUser.password)
    await profile.logInto()
    await profile.goProfile()
    const newFirstName = "UpdatedName";
    await profile.basicDetails(newFirstName);
    await updateUserFirstName(testUser.username,newFirstName)

    const updatedUser = await getUserByUsername(testUser.username)
    expect(updatedUser.first_name).toBe(newFirstName)
})

test("Votes persist correct timestamp",async({page})=>{
    allure.severity('normal');
    allure.story('Votes are timestamped correctly in DB');
    allure.tag("database")
    allure.tag('positive');

    const testUser = await generateTestUser();
    testUser.id = await insertUsers(testUser);
    await registerUserViaUI(page, testUser, registerPage);

    await home.goMainPage();
    await home.logIntoDetails(testUser.username, testUser.password);
    await home.goToCarsOptions();
    await home.goSpecificCar()

    const comment = "DBTestComment";
    await home.vote(comment);

    const user_id = testUser.id;
    const car_id = 1; 
    await vote({ user_id, car_id, comment });

    const latestVote = await getLatestVote()
    const timestamp = new Date(latestVote.created_at).getTime();
    const now = Date.now();
    expect(Math.abs(now - timestamp)).toBeLessThan(5000);
})

test("Multiple votes prevention",async({page})=>{
    allure.severity('critical');
    allure.story('User cannot vote multiple times on same car/comment');
    allure.tag("database")
    allure.tag('security');


    const testUser = await generateTestUser();
    testUser.id = await insertUsers(testUser);
    await registerUserViaUI(page, testUser, registerPage);

    await home.goMainPage();
    await home.logIntoDetails(testUser.username, testUser.password);
    await home.goToCarsOptions();
    const car_id = await home.goSpecificCar();

    const comment = "DBTestComment";
    await home.vote(comment);

    const user_id = testUser.id; 
    await vote({ user_id, car_id, comment });
    let latestVote = await getVoteByUserAndComment(testUser.id, comment);
    expect(latestVote).not.toBeNull();
    expect(latestVote.user_id).toBe(testUser.id);
    expect(latestVote.comment).toBe(comment);

    

    const comment_repeat = "DBTestCommentMultiple";
    await home.vote(comment_repeat)
    
    const loggedOut = await home.logOutText();
    await expect(loggedOut).toEqual("Thank you for your vote!")

    const duplicateVote = await getVoteByUserAndComment(user_id, comment_repeat);
    expect(duplicateVote).toBeNull();
    
})
})