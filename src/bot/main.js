const path = require("path");
const fs = require("fs");
const puppeteer = require('puppeteer-extra')
const stealth = require("puppeteer-extra-plugin-stealth");
const solveCaptcha = require("./utils/solveCaptcha");
const handleBuster = require("./utils/extensionBuster");
const solver = path.join(process.cwd(), "src/bot/extension/buster/");
const adsblock = path.join(process.cwd(), "src/bot/extension/adblock/");
const production = process.env.NODE_ENV === "production" || false;
const baseUrl = 'https://smallseotools.com/domain-authority-checker/'
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

    props.buster && page.on('load', async () => {
        await solveCaptcha(handleInfo, page)
    })

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
            await solveCaptcha(handleInfo, page)

            await page.waitForNavigation({
                waitUntil: ['networkidle2', 'domcontentloaded'],
                timeout: 120000
            })

            await page.waitForSelector('#result_section', {
                waitUntil: 120000
            })

            await page.sleep(3000)

            let result = [];
            
            // TODO: The extracting section should be an separate function
            handleInfo('Extracting data')
            const defaultSelector = 'body > div:nth-child(9) > div > div.main_area.text-center > div.bg-white.p-4.mps.border1.text-center.text-break > div >'
            const DA = await page.$$(`${defaultSelector} div:nth-child(2) > span`);

            for (const [i, el] of DA.entries()) {
                const text = await page.evaluate(element => element.innerText, el);
                result.push(text);
            }

            handleInfo('Data:', result);

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
    buster: true
})