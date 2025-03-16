const puppeteer = require('puppeteer');
const fs = require('fs');
const express = require('express');
const app = express();

const randomDelay = (min, max) => {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, ms));
};

const bots = fs.readFileSync('bots.txt', 'utf-8').split('\n').filter(Boolean);
const results = [];

app.get('/', (req, res) => res.send('Bot is running')); // نقطة نهاية لـ UptimeRobot

(async () => {
  app.listen(process.env.PORT || 3000, () => console.log(`Server started on port ${process.env.PORT || 3000}`));

  for (let i = 0; i < bots.length; i++) {
    const url = bots[i];
    const browser = await puppeteer.launch({
      headless: 'new', // استخدام الوضع الجديد للheadless
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // تحسين الأداء في بيئات الحاويات
        '--disable-gpu', // تعطيل GPU لتوفير الموارد
      ],
    });
    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      await randomDelay(3000, 7000);

      await page.click("div._navBarSection_ww9o8_97 > div > div > div > div:nth-of-type(1) > div");
      await randomDelay(1000, 3000);
      await page.click("div._navBarSection_ww9o8_97 > div > div > div > div:nth-of-type(2) > div");
      await randomDelay(1000, 3000);
      await page.click("div._navBarSection_ww9o8_97 > div > div > div > div:nth-of-type(1) > div");

      await page.reload({ waitUntil: 'networkidle2' });
      await randomDelay(3000, 7000);

      await page.waitForSelector("div._tapArea_njdmz_15", { visible: true, timeout: 15000 });
      const eagle = await page.$("div._tapArea_njdmz_15");
      if (!eagle) throw new Error("النسر غير جاهز للنقر!");

      console.log(`تم النقر في الحساب ${i + 1}`);
      let clickCount = 0;

      while (true) {
        const energyElement = await page.waitForSelector("div[class*='_energyContainer_']", { timeout: 5000 });
        const energyText = await page.evaluate(el => el.textContent, energyElement);
        const currentEnergy = parseInt(energyText.split('/')[0].trim());

        if (currentEnergy <= 0) {
          await page.click("div._navBarSection_ww9o8_97 > div > div > div > div:nth-of-type(2) > div");
          await randomDelay(1000, 3000);
          await page.click("div._navBarSection_ww9o8_97 > div > div > div > div:nth-of-type(1) > div");
          await randomDelay(1000, 3000);
          await page.click("div._navBarSection_ww9o8_97 > div > div > div > div:nth-of-type(2) > div");

          console.log(`اكتمل النقر في الحساب ${i + 1}، الرصيد: ${clickCount} نقاط`);
          results.push({ account: i + 1, points: clickCount });
          break;
        }

        await page.click("div._tapArea_njdmz_15");
        clickCount++;
        await randomDelay(10, 50);
      }
    } catch (e) {
      console.log(`خطأ في الحساب ${i + 1}: ${e.message}`);
      results.push({ account: i + 1, points: 0 });
    } finally {
      await browser.close();
      await randomDelay(5000, 10000);
    }
  }

  console.log("\n--- ملخص الحسابات ---");
  results.forEach(result => {
    console.log(`الحساب ${result.account}: ${result.points} نقاط`);
  });
})();
