// PR: something wrong here cause the promise never resolve even the captcha not found
async function solveCaptcha(handleInfo, page) {
    return new Promise(async (resolve, reject) => {
        try {
            const captchaBox = await page.$('[title="reCAPTCHA"]')
            if (captchaBox) {
                handleInfo("Captcha Found Solve....");
                const elIframe = await page.waitForSelector('iframe[title="recaptcha challenge expires in two minutes"]');
                if (elIframe) {
                    const iframe = await elIframe.contentFrame();
                    if (iframe) {
                        const body = await iframe.waitForSelector('body');
                        if (body) {
                            const solverButton = await body.$('button[id="solver-button"]');
                            if (solverButton) {
                                try {
                                    await page.sleep(3000)
                                    await solverButton.click();
                                    await page.sleep(3000)
                                    handleInfo('Captcha Solved....');
                                } catch (error) {
                                    handleInfo('Error clicking the button:', error.message);
                                    reject(error);
                                }
                            } else {
                                handleInfo('Button not found in the iframe body.');
                                reject(new Error('Button not found in the iframe body.'));
                            }
                        } else {
                            handleInfo('Body element not found in the iframe.');
                            reject(new Error('Body element not found in the iframe.'));
                        }
                    } else {
                        handleInfo('Content frame not found for the iframe.');
                        reject(new Error('Content frame not found for the iframe.'));
                    }
                } else {
                    handleInfo('Iframe with title "captcha" not found on the page.');
                    reject(new Error('Iframe with title "captcha" not found on the page.'));
                }
            }

            resolve();
        } catch (error) {
            handleInfo(error);
            reject(error);
        }
    });
}

module.exports = solveCaptcha;