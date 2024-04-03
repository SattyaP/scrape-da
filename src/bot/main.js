const path = require("path");
const fs = require("fs");
const puppeteer = require('puppeteer-extra')
const stealth = require("puppeteer-extra-plugin-stealth");
const solveCaptcha = require("./utils/solveCaptcha");
const handleBuster = require("./utils/extensionBuster");
const solver = path.join(process.cwd(), "src/bot/extension/buster/");
const adsblock = path.join(process.cwd(), "src/bot/extension/adblock/");
const production = process.env.NODE_ENV === "production" || false;
// const baseUrl = 'https://smallseotools.com/domain-authority-checker/'
const baseUrl = 'file:///E:/Documents/Kerja/bot-da/pages/Domain%20Authority%20Checker%20-%20Moz%20DA%20PA%20Checker%20of%20multiple%20urls.html'
puppeteer.use(stealth());

function handleInfo(message) {
    if (production) {
        log("[INFO] " + message)
    } else {
        console.log(message)
    }
}

function handleError(message) {
    if (production) {
        log(message)
    } else {
        console.error(message)
    }
}

const app = async (handleInfo, handleError, props) => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: [
            `--disable-extensions-except=${solver},${adsblock}`,
            `--load-extension=${solver},${adsblock}`,
            "--disable-popup-blocking",
        ],
    });

    const context = browser.defaultBrowserContext();
    context.overridePermissions(baseUrl, ["geolocation", "notifications"]);

    const page = await browser.newPage();


    page.sleep = function (timeout) {
        return new Promise(function (resolve) {
            setTimeout(resolve, timeout);
        });
    };

    page.on('dialog', async dialog => {
        await dialog.dismiss();
    })

    const Scrape = async () => {
        try {
            props.buster && await handleBuster('YXXP7NHK3HBMWCGU22RJOED3L2XPX3X6', page)

            handleInfo('Navigating to the website')
            await page.goto(baseUrl, {
                waitUntil: ['domcontentloaded', 'networkidle2'],
                timeout: 120000
            })

            handleInfo('Waiting for the result')
            await page.waitForSelector('#result_section', {
                waitUntil: 120000
            })

            const selectorData = [
                'body > div:nth-child(9) > div > div.main_area.text-center > div.bg-white.p-4.mps.border1.text-center.text-break > div > div.border1.box_w1.border-top-0.p-2.d-flex > div.d-flex.align-items-center',
                'body > div:nth-child(9) > div > div.main_area.text-center > div.bg-white.p-4.mps.border1.text-center.text-break > div > div:nth-child(2) > span',
                'body > div:nth-child(9) > div > div.main_area.text-center > div.bg-white.p-4.mps.border1.text-center.text-break > div > div:nth-child(3) > span',
                'body > div:nth-child(9) > div > div.main_area.text-center > div.bg-white.p-4.mps.border1.text-center.text-break > div > div.border1.box_w4.border-top-0.border-left-0.px-1.py-2.d-flex.align-items-center.justify-content-center.mdn'
            ]

            // TODO: Selector already correct now we need to handle and manage the data as for what tommorow

            for (let i = 0; i < selectorData.length; i++) {
                const elements = await page.$$(selectorData[i]);
                for (let j = 0; j < elements.length; j++) {
                    if (elements.length > 0) {
                        const url = await page.evaluate(el => el.innerText, elements[j]);
                        handleInfo(innerText);
                    } else {
                        console.log('result not found');
                    }
                }
            }

            return;

            const data = [
                'https://www.google.com',
                'https://www.facebook.com',
                'https://www.twitter.com',
            ]

            handleInfo('Inputting data')
            const input = await page.waitForSelector('#urls')
            if (input) {
                await input.click()
                await page.$eval('#urls', (el, data) => el.value = data.join('\n'), data)
            }

            await page.sleep(3000)

            handleInfo('Checking wushh... 🚀')
            await page.waitForSelector('button[name="domainAuthority"]')
            await page.$eval('button[name="domainAuthority"]', el => el.click())

            await page.sleep(3000)
            // await solveCaptcha(handleInfo, page)

            await page.sleep(3000)

            let result = [];

            // TODO: The extracting section should be an separate function
            handleInfo('Extracting data')


            // for (const [i, el] of DA.entries()) {
            //     const text = await page.evaluate(element => element.innerText, el);
            //     result.push(text);
            // }

            const DAData = await page.evaluate(() => {
                const data = document.querySelector("body > div:nth-child(9) > div > div.main_area.text-center > div.bg-white.p-4.mps.border1.text-center.text-break > div:nth-child(2) > div:nth-child(2) > span").innerText
                return data;
            });

            handleInfo('Data:', DAData);

            // Not working
            // const getData = await page.evaluate(() => {
            //     let result = []
            //     const defaultSelector = 'body > div:nth-child(9) > div > div.main_area.text-center > div.bg-white.p-4.mps.border1.text-center.text-break > div >'
            //     const DAElement = document.querySelectorAll(`${defaultSelector} div:nth-child(2) > span`)
            //     const DOMElement = document.querySelectorAll(`${defaultSelector} div.border1.box_w1.border-top-0.p-2.d-flex > div.d-flex.align-items-center`)
            //     const PAElement = document.querySelectorAll(`${defaultSelector} div:nth-child(3) > span`)
            //     const LDElement = document.querySelectorAll(`${defaultSelector} div.border1.box_w4.border-top-0.border-left-0.px-1.py-2.d-flex.align-items-center.justify-content-center.mdn`)

            //     DAElement.forEach((el, i) => {
            //         result.push({
            //             url: el.innerText,
            //             DA: DOMElement[i].innerText,
            //             PA: PAElement[i].innerText,
            //             LD: LDElement[i].innerText
            //         })
            //     })

            //     console.log(result);
            //     return result;
            // })


        } catch (error) {
            handleError(error)
            await browser.close()
        }
    }

    Scrape()
}

app(handleInfo, handleError, props = {
    buster: false
})