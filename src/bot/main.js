const path = require("path");
const fs = require("fs");
const puppeteer = require('puppeteer-extra')
const stealth = require("puppeteer-extra-plugin-stealth");
const solveCaptcha = require("./utils/solveCaptcha");
const handleBuster = require("./utils/extensionBuster");
puppeteer.use(stealth());

const solver = path.join(process.cwd(), "src/bot/extension/buster/");
const adsblock = path.join(process.cwd(), "src/bot/extension/adblock/");
const baseUrl = 'https://smallseotools.com/domain-authority-checker/'

const app = async (handleInfo, handleError, props) => {
    const browser = await puppeteer.launch({
        headless: props.headless,
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

    props.buster && await handleBuster('YXXP7NHK3HBMWCGU22RJOED3L2XPX3X6', page)

    handleInfo('Navigating to the website')
    await page.goto(baseUrl, {
        waitUntil: ['domcontentloaded', 'networkidle2'],
        timeout: 120000
    })

    const Scrape = async (urls) => {
        try {
            handleInfo('Inputting data')
            const input = await page.waitForSelector('#urls')

            if (input) {
                await input.click()
                await page.$eval('#urls', (el, urls) => el.value = urls.join('\n'), urls)
            }

            await page.sleep(3000)

            handleInfo('Checking wushh... 🚀')
            await page.waitForSelector('button[name="domainAuthority"]', {
                waitUntil: 120000
            })
            await page.$eval('button[name="domainAuthority"]', el => el.click())

            await page.sleep(3000)

            handleInfo('Extracting data')
            await extractData()

        } catch (error) {
            handleError(error)
            await browser.close()
        }
    }

    const extractData = async () => {
        handleInfo('Waiting for the result')
        try {
            await page.waitForSelector('#result_section', {
                waitUntil: 120000
            })

            const selectorData = {
                url: 'body > div:nth-child(9) > div > div.main_area.text-center > div.bg-white.p-4.mps.border1.text-center.text-break > div > div.border1.box_w1.border-top-0.p-2.d-flex > div.d-flex.align-items-center',
                da: 'body > div:nth-child(9) > div > div.main_area.text-center > div.bg-white.p-4.mps.border1.text-center.text-break > div > div:nth-child(2) > span',
                pa: 'body > div:nth-child(9) > div > div.main_area.text-center > div.bg-white.p-4.mps.border1.text-center.text-break > div > div:nth-child(3) > span',
                ld: 'body > div:nth-child(9) > div > div.main_area.text-center > div.bg-white.p-4.mps.border1.text-center.text-break > div > div.border1.box_w4.border-top-0.border-left-0.px-1.py-2.d-flex.align-items-center.justify-content-center.mdn'
            }

            const urls = await page.$$(selectorData.url)
            const das = await page.$$(selectorData.da)
            const pas = await page.$$(selectorData.pa)
            const lds = await page.$$(selectorData.ld)

            const results = [];
            for (let i = 0; i < urls.length; i++) {
                results.push({
                    url: await page.evaluate(e => e.innerText, urls[i]),
                    da: await page.evaluate(e => e.innerText, das[i]),
                    pa: await page.evaluate(e => e.innerText, pas[i]),
                    ld: await page.evaluate(e => e.innerText, lds[i])
                })
            }

            return results;
        } catch (error) {
            handleError(error)
            throw error;
        }
    }

    const getFilesData = () => {
        try {
            const files = fs.readFileSync(props.files, "utf-8");
            const datas = files.replace(/\r/g, "").split("\n").filter(line => line !== "");

            const results = [];
            for (let i = 0; i < datas.length; i += 10) {
                results.push(datas.slice(i, i + 10));
            }

            return results;
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const workFlow = async () => {
        try {
            const urls = getFilesData();
            for (let i = 0; i < urls.length; i++) {
                handleInfo(`Processing batch ${i + 1}`)
                await Scrape(urls[i])
            }

            handleInfo('Done! 🎉')
            await browser.close()
        } catch (error) {
            handleError(error)
            await browser.close()
        }
    }

    await workFlow();
}

module.exports = app;