exports.BasePage = class BasePage {
  constructor(page) {
    this.page = page;
    this.homeLink = page.getByRole("link",{name:'Buggy Rating'})
    this.userLink = page.locator(".nav-link.disabled")
  }

   async goHome() {
    await this.homeLink.click();
  }
  async userHandle() {
    return await this.userLink.textContent()
  }

}