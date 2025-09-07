import {test,expect} from '@playwright/test'
import { captureRequests } from '../../src/utils/apiHelper';

test('discover login request', async ({ page }) => {
  await page.goto('https://buggy.justtestit.org/');

  const requests = await captureRequests(page, async () => {
    await page.fill("input[placeholder='Login']", 'SeenB');
    await page.fill("input[name='password']", 'Trilerko12$');
    await page.click("button[type='submit']");
  });

  console.log('Captured requests:', requests);
});
