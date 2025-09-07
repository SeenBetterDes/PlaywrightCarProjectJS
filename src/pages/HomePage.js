const { BasePage } = require("./basePage")

exports.HomePage = class HomePage extends BasePage {
    constructor(page) {
        super(page)
        this.loginField = page.locator("input[placeholder='Login']");
        this.passwordField = page.locator("input[name='password']");
        this.loginButton = page.getByRole('button', { name: 'Login' });
        this.carImagePage = page.locator("img[src='/img/overall.jpg']")

        this.car = page.locator('.img-thumbnail');

        this.loggedOutText = page.locator(".card-text")
        this.voteButton = page.getByRole("button",{name:"Vote!"})
        this.voteCount = page.locator("div[class='card-block'] h4 strong");
        this.comment = page.locator("#comment")
        this.commentsInTable = page.locator("table tbody tr td:nth-child(3)")

        this.pagination = page.locator(".pagination li a"); 
        this.logoutButton = page.getByRole('link',{name:'Logout'})
    }

    async goMainPage() {
        await this.page.goto("https://buggy.justtestit.org/")
    }
    async logIntoDetails(loginField,password) {
        await this.loginField.fill(loginField)
        await this.passwordField.fill(password)
        await this.loginButton.click()
    }

    async goToCarsOptions() {
        await this.carImagePage.click()
    }

    async goSpecificCar() {
        await this.car.first().click()
        return 1
    }

    async goRandomCar() {
    
    await this.page.waitForLoadState('networkidle');

    
    const totalPages = await this.pagination.count();
    if (totalPages > 1) {
        const randomPageIndex = Math.floor(Math.random() * totalPages);
        await this.pagination.nth(randomPageIndex).click();
        await this.page.waitForLoadState('networkidle');
    }

    
    const cars = this.page.locator('.img-thumbnail');
    await cars.first().waitFor({ state: 'visible', timeout: 10000 });


    const carCount = await cars.count();
    const randomIndex = Math.floor(Math.random() * carCount);
    const chosenCar = cars.nth(randomIndex);

    
    await chosenCar.scrollIntoViewIfNeeded();
    await chosenCar.waitFor({ state: 'visible', timeout: 5000 });
    await chosenCar.click();

    
    return randomIndex + 1;
}


    async vote(message) {
        await this.comment.fill(message)
        await this.voteButton.waitFor({ state: 'visible', timeout: 5000 });
        await this.voteButton.click()
    }

    async getVoteCount() {
        const text = await this.voteCount.textContent();
        return Number(text?.trim());
    }

    

    async getComments() {
        await this.commentsInTable.first().waitFor();
        return this.commentsInTable.allTextContents();
    }

    async logOutText() {
        await this.loggedOutText.scrollIntoViewIfNeeded();
        return this.loggedOutText.textContent()
    }

    async logout() {
        await this.logoutButton.click()

    }
}