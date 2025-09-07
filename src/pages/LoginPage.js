const { BasePage } = require("./basePage");

exports.LoginPage = class LoginPage extends BasePage{
    constructor(page){
        super(page)
        this.loginField = page.locator("input[placeholder='Login']");
        this.password = page.locator("input[name='password']");
        this.loginButton = page.getByRole('button', { name: 'Login' });
        this.profilePage = page.getByRole('link', { name: 'Profile' });
        this.firstName = page.getByRole('textbox',{ name:'First Name'})
        this.successAlert = page.locator(".result.alert.alert-success")
        this.errorAlert = page.locator('.label.label-warning');
        this.logoutButton = page.getByRole('link',{name:'Logout'})
        
    }

    async goMainPage() {
        await this.page.goto("https://buggy.justtestit.org/")
    }


    async logIntoDetails(loginField,password) {
        await this.loginField.fill(loginField)
        await this.password.fill(password)
    }

    async logInto() {
        await this.loginButton.click()
    }

    async checkNavBarName() {
        await this.profilePage.click()
        return this.firstName;
    }

    async reloadPage() {
        await this.page.reload()
    }

    async navigateProfile() {
        await this.page.goto("https://buggy.justtestit.org/profile")
    }

    

  


}