const { BasePage } = require("./basePage");
exports.ProfilePage = class ProfilePage extends BasePage{

    constructor(page){
        super(page)
        this.loginField = page.locator("input[placeholder='Login']");
        this.passwordField = page.locator("input[name='password']");
        this.loginButton = page.getByRole('button', { name: 'Login' });
        this.profile = page.getByRole('link',{name:'Profile'})


        this.firstName = page.getByRole('textbox',{ name:'First Name'})
        this.successAlert = page.locator(".result.alert.alert-success")
        this.errorAlert = page.locator('.label.label-warning');
        this.password = page.getByLabel("Current Password")
        this.passwordNew = page.locator("#newPassword")
        this.passwordNewRepeat = page.getByLabel("Confirm Password")
        
        this.submit = page.getByRole('button',{ name:'Save'})
        this.cancel = page.getByRole('link',{ name:'Cancel'})
        this.result = page.locator(".result")
        this.logoutButton = page.getByRole('link',{name:'Logout'})
    }

    async goMainPage() {
        await this.page.goto("https://buggy.justtestit.org/")
    }
    async logIntoDetails(loginField,password) {
        await this.loginField.fill(loginField)
        await this.passwordField.fill(password)
    }
    async logInto() {
        await this.loginButton.click()
    }

    async goProfile(){
        await this.profile.click()
    }


    async userLinkText() {
        await this.userLink.waitFor({ state: 'visible', timeout: 5000 });
        return this.userLink.textContent()
    }

    
    async basicDetails(firstName){
        await this.firstName.fill(firstName)
        await this.submit.click()
        
    }
    
    async additionalPassword(current,newPass){
    await this.password.waitFor({ state: 'visible' });
    await this.password.scrollIntoViewIfNeeded();
    await this.password.fill(current);

    await this.passwordNew.waitFor({ state: 'visible' });
    await this.passwordNew.scrollIntoViewIfNeeded();
    await this.passwordNew.fill(newPass);

    await this.passwordNewRepeat.waitFor({ state: 'visible' });
    await this.passwordNewRepeat.scrollIntoViewIfNeeded();
    await this.passwordNewRepeat.fill(newPass);

    await this.submit.click()
    }
    async cancelDetails() {
        await this.cancel.click()
    }

    async logout() {
        await this.logoutButton.click()
    }

    
}