const path = require("path");
const fs = require("fs");

const handleBuster = async (busterKey, page) => {
    try {
        const pathId = path.join(process.cwd(), 'src/bot/data/id.txt');
        const id = fs.readFileSync(pathId, 'utf-8')
        if (id === '') {
            await page.goto('chrome://extensions', {
                waitUntil: ['domcontentloaded', "networkidle2"],
                timeout: 120000
            })
        } else {
            await page.goto(`chrome-extension://${id.trim()}/src/options/index.html`, {
                waitUntil: ['domcontentloaded', "networkidle2"],
                timeout: 120000
            })
        }

        if (id === '') {
            const idExtension = await page.evaluateHandle(
                'document.querySelector("body > extensions-manager").shadowRoot.querySelector("#items-list").shadowRoot.querySelectorAll("extensions-item")[1]'
            );
            await page.evaluate(e => e.style = "", idExtension)

            const id = await page.evaluate(e => e.getAttribute('id'), idExtension)

            await page.goto(`chrome-extension://${id}/src/options/index.html`, {
                waitUntil: ['domcontentloaded', "networkidle2"],
                timeout: 60000
            })

            fs.writeFileSync(pathId, id)
        }

        await page.sleep(3000)

        await page.evaluate(() => {
            document.querySelector("#app > div > div:nth-child(1) > div.option-wrap > div.option.select > div > div.v-input__control > div > div.v-field__field > div").click()
        })
        await page.sleep(3000)
        await page.evaluate(() => {
            document.querySelector("body > div.v-overlay-container > div > div > div > div:nth-child(3)").click()
        })

        const addApi = await page.$('#app > div > div:nth-child(1) > div.option-wrap > div.wit-add-api > button')
        addApi && await addApi.click()

        const fieldApi = await page.waitForSelector('#input-18')
        fieldApi && await fieldApi.type(busterKey)
    } catch (error) {
        throw error;
    }
}

module.exports = handleBuster;