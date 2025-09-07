export async function captureRequests(page, actionCallback) {
  const requests = [];

  page.on('request', request => {
    if (request.resourceType() === 'xhr') {
      requests.push({
        url: request.url(),
        method: request.method(),
        postData: request.postData(),
        headers: request.headers()
      });
    }
  });

  await actionCallback(); 
  await page.waitForTimeout(2000); 
  return requests;
}
