let browser: any;

if (process.env.NODE_ENV === 'test') {
    const { chromium } = await import ('playwright');
    browser = await chromium.launch({ headless: false });
}

export async function testBrowser() {
    return browser;
}