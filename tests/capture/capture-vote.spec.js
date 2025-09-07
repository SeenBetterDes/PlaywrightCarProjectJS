import {test} from '@playwright/test'
import { captureRequests } from '../../src/utils/apiHelper'
import { HomePage } from '../../src/pages/HomePage';
import { registerUserViaUI,generateTestUser } from '../../src/utils/dbHelper';
import { RegisterPage } from '../../src/pages/RegisterPage';


test("capture vote request",async({page})=>{
    const home = new HomePage(page);
    const registerPage = new RegisterPage(page)
    const testUser = await generateTestUser();
    await registerUserViaUI(page, testUser, registerPage);
    await home.goMainPage()
    await home.logIntoDetails(testUser.username,testUser.password)
    await home.goToCarsOptions()
    await home.goSpecificCar()
    
    const requests = await captureRequests(page,async()=>{
        await page.click(".btn.btn-success")
    })

    console.log('Captured requests: ', requests)

})