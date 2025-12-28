import chromium from "chrome-aws-lambda"
import * as cheerio from "cheerio";
import fetch from "node-fetch";

const BOT_TOKEN = "8390602723:AAF7O4Tc-RJWcaZejRWxm_h_FeKaD5W4qXw";
const CHAT_ID = "7699020587"; // ID kamu

export default async function handler(req, res) {
  let browser = null;
  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto("https://cookin.fun", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    const html = await page.content();
    const $ = cheerio.load(html);

    const links = [];
    $("a[href*='/token/']").each((i, el) => {
      const href = $(el).attr("href");
      if (href && href.includes("/token/") && !links.includes(href)) {
        links.push(href);
      }
    });

    if (links.length === 0) {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: "⚠️ Tidak ada token baru di Cookin.fun (mungkin halaman belum render).",
        }),
      });
      return res.status(200).json({ ok: false, reason: "no tokens" });
    }

    const resultText =
      "🔥 *Cookin.fun New Tokens Detected:*\n\n" +
      links.slice(0, 3).map((x) => `🔹 https://cookin.fun${x}`).join("\n");

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: resultText,
        parse_mode: "Markdown",
      }),
    });

    res.status(200).json({ ok: true, tokens: links.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}

