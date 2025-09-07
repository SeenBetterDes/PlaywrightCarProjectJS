const { BasePage } = require("./BasePage");

exports.RegisterPage = class RegisterPage extends BasePage{

    constructor(page){
        super(page)
        this.register = page.locator(".btn.btn-success-outline");
        this.userName = page.locator("#username");
        this.firstName = page.locator("#firstName");
        this.lastName = page.locator("#lastName");
        this.password = page.locator("#password");
        this.confirmPassword = page.locator("#confirmPassword");
        this.registerButton = page.getByRole('button',{name:'Register'})
        this.successAlert = page.locator(".result.alert.alert-success")
        this.fieldErrorAlert = page.locator(".alert.alert-danger")
        this.errorAlert = page.locator(".result.alert.alert-danger")
        this.homeLink = page.locator(".navbar-brand");
        
    }

    async goMainPage(){
        await this.page.goto("https://buggy.justtestit.org/")
    }

    async goRegisterPage(){
        await this.register.click()
    }

    async registerValidUser(userName,firstName,lastName,password,confirmPassword) {
        await this.userName.fill(userName);
        await this.firstName.fill(firstName);
        await this.lastName.fill(lastName);
        await this.password.fill(password);
        await this.confirmPassword.fill(confirmPassword);
        if (password === confirmPassword) {
            const isEnabled = await this.registerButton.isEnabled();
            if (isEnabled) {
             await this.registerButton.click();
    }
}
    }
    async goBackHome(){
        await this.goHome()
    }
}