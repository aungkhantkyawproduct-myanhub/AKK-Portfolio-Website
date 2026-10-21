import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import fs from "node:fs/promises";
await fs.mkdir("artifacts/verification", { recursive: true });
const chrome = await launch({
  chromePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  chromeFlags: ["--headless", "--no-sandbox"],
});
try {
  const result = await lighthouse("http://127.0.0.1:4173/", {
    port: chrome.port,
    output: "json",
    onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    formFactor: "desktop",
    screenEmulation: {
      mobile: false,
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      disabled: false,
    },
    throttlingMethod: "provided",
  });
  await fs.writeFile("artifacts/verification/lighthouse.json", result.report);
  console.log(
    JSON.stringify(
      Object.fromEntries(
        Object.entries(result.lhr.categories).map(([k, v]) => [k, v.score]),
      ),
    ),
  );
  console.log(
    JSON.stringify(
      Object.values(result.lhr.audits)
        .filter((a) => a.score !== null && a.score < 1 && a.details)
        .map((a) => ({
          id: a.id,
          title: a.title,
          score: a.score,
          display: a.displayValue,
        })),
      null,
      2,
    ),
  );
} finally {
  await chrome.kill();
}
