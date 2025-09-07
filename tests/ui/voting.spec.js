import {test,expect,chromium} from '@playwright/test'
import { HomePage } from "../../src/pages/homePage"
import { RegisterPage } from '../../src/pages/RegisterPage';
import * as allure from "allure-js-commons";
const { insertUsers,registerUserViaUI,generateTestUser,vote,getLatestVote,deleteUser,getVoteByUserAndComment} = require('../../src/utils/dbHelper');

test.describe("Voting tests",()=>{
    let home
    let registerPage
    test.beforeEach(async({page})=>{
        allure.epic("User managment")
        allure.feature("Voting")
        home = new HomePage(page)
        registerPage = new RegisterPage(page)
    })

test("Vote functionality without login",async({page})=>{
    allure.severity('critical');
    allure.story('Vote button is hidden for logged-out users');
    allure.tag('negative');
    
    await home.goMainPage()
    await home.goToCarsOptions()
    await home.goSpecificCar()
    const loggedOut = await home.logOutText();
    await expect(home.voteButton).not.toBeVisible();
    await expect(loggedOut).toContain("You need to be logged in to vote.")
})

test("Vote with valid user",async({page})=>{
    allure.severity('critical');
    allure.story('Registered user can vote successfully');
    allure.tag('positive');
    
    const testUser = await generateTestUser();
    testUser.id = await insertUsers(testUser);
    await registerUserViaUI(page, testUser, registerPage);

    try {
       await home.goMainPage();
       await home.logIntoDetails(testUser.username, testUser.password);
       await home.goToCarsOptions();
       const car_id = await home.goRandomCar();

       const comment = `TestComment_${Date.now()}`;
       await home.vote(comment);

       const loggedOut = await home.logOutText();
       await expect(loggedOut).toEqual("Thank you for your vote!");

       const user_id = testUser.id;
       await vote({ user_id, car_id, comment });

       const latestVote = await getLatestVote();
       expect(latestVote.user_id).toBe(user_id);
       expect(latestVote.comment).toBe(comment);

}   finally {
       await deleteUser(testUser.username);
}


})

test("Concurrent Voting(Vote count incrementation)",async()=>{
    allure.severity('critical');
    allure.story('Multiple users voting concurrently increments vote count correctly');
    allure.tag('positive');

    const users = [await generateTestUser(),await generateTestUser()]

    for(const user of users) {
        user.id = await insertUsers(user);
    }

    for(const user of users) {
        const browser = await chromium.launch(); 
        const context = await browser.newContext();
        const page = await context.newPage();
        const registerPage = new RegisterPage(page);
        await registerUserViaUI(page, user, registerPage);
        await context.close();
        await browser.close()
  }
    await Promise.all(users.map(async (user) => {
        const browser = await chromium.launch(); 
        const context = await browser.newContext(); 
        const page = await context.newPage();
        const home = new HomePage(page);

        await home.goMainPage()
        await home.logIntoDetails(user.username,user.password)
        await home.goToCarsOptions()
        const car_id = await home.goSpecificCar()

        const oldCount = await home.getVoteCount()
        const comment = `Vote_${Date.now()}`;
        await home.vote(comment)
        

        const loggedOut = await home.logOutText();
        await expect(loggedOut).toEqual("Thank you for your vote!")

        const comments = await home.getComments()
        await expect(comments).toContain(comment)

        const newCount = await home.getVoteCount()
        await expect(newCount).toBe(oldCount + users.length);

        
        await vote({ user_id: user.id, car_id, comment });
        const latestVote = await getVoteByUserAndComment(user.id, comment);
        expect(latestVote).not.toBeNull();
        expect(latestVote.user_id).toBe(user.id);
        expect(latestVote.comment).toBe(comment);
        await context.close()
        await browser.close()

        

    }))
    for (const user of users) {
           await deleteUser(user.username);
  }
});

test("Cross-Page vote persistance",async({page})=>{
    allure.severity('critical');
    allure.story('Votes persist across pages for a user');
    allure.tag('positive');

    const testUser = await generateTestUser();
    testUser.id = await insertUsers(testUser);
    await registerUserViaUI(page, testUser, registerPage);

    
    await home.goHome()
    await home.logIntoDetails(testUser.username, testUser.password);
    await home.goToCarsOptions()

    const car_id = await home.goSpecificCar();

    const comment = `TestComment_${Date.now()}`;
    await home.vote(comment);

    let loggedOut = await home.logOutText();
    await expect(loggedOut).toEqual("Thank you for your vote!");
    const comments = await home.getComments();
    await expect(comments).toContain(comment);

    await vote({ user_id: testUser.id, car_id, comment });

    await home.logout()

    await home.goHome()
    await home.logIntoDetails(testUser.username, testUser.password);
    await home.goToCarsOptions()
    await home.goSpecificCar()

    await expect(home.voteButton).not.toBeVisible()
    loggedOut = await home.logOutText()
    await expect(loggedOut).toEqual("Thank you for your vote!")

    

})

test("Cross-Browser vote persistance",async()=>{
    allure.severity('critical');
    allure.story('Votes persist across different browser sessions');
    allure.tag('positive');

    const isCI = process.env.CI === 'true';
    const context = await chromium.launchPersistentContext('',{headless:isCI})
    const page = await context.newPage()
    
    
    const testUser = await generateTestUser();
    testUser.id = await insertUsers(testUser);
    await registerUserViaUI(page, testUser, registerPage);

    await home.goHome()
    await home.logIntoDetails(testUser.username,testUser.password)
    await home.goToCarsOptions()
    const car_id = await home.goSpecificCar();

    const comment = `Vote_${Date.now()}`;
    await home.vote(comment);

    const loggedOut = await home.logOutText();
    await expect(loggedOut).toEqual("Thank you for your vote!")
    const comments = await home.getComments()
    await expect(comments).toContain(comment)

    await vote({ user_id: testUser.id, car_id, comment });
    const latestVote = await getLatestVote();
    expect(latestVote).not.toBeNull();
    

    await context.close()

    const newContext = await chromium.launchPersistentContext('', { headless: isCI });
    const newPage = await newContext.newPage();
    const newHome = new HomePage(newPage);

    await newHome.goMainPage()
    await newHome.logIntoDetails(testUser.username, testUser.password);
    await newHome.goToCarsOptions();
    await newHome.goSpecificCar(car_id);
    

    await expect(newHome.voteButton).not.toBeVisible()
    const alreadyVoted = await newHome.logOutText()
    await expect(alreadyVoted).toEqual("Thank you for your vote!")
    await newContext.close()
})

})
