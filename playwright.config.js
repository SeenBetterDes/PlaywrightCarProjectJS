// @ts-check
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  
  fullyParallel: false,

  
  forbidOnly: !!process.env.CI,

  
  retries: process.env.CI ? 2 : 0,

  
  workers: process.env.CI ? 1 : undefined,

  
  timeout: 60_000,

  
  reporter: [
    ['list'], 
    ['allure-playwright', { outputFolder: 'allure-results', suiteTitle: false }]
  ],

  
  use: {
    trace: 'on-first-retry',   
    screenshot: 'only-on-failure', 
    baseURL: 'https://buggycarsrating.com', 
    headless: true
  },

  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    
  ]
});
