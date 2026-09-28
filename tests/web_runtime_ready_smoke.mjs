import { chromium } from "playwright";

const baseUrl = process.env.PIECEPACE_WEB_URL ?? "http://127.0.0.1:4173/";
const expectedSha = process.env.GITHUB_SHA ?? "";
const pageErrors = [];

const browser = await chromium.launch({
  headless: true,
  args: [
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--enable-unsafe-swiftshader",
  ],
});

try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  const response = await page.goto(baseUrl, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  if (response == null || !response.ok()) {
    throw new Error(`Page load failed: ${response?.status() ?? "no response"}`);
  }

  await page.waitForFunction(
    () => globalThis.__PIECEPACE_READY__ === true,
    null,
    { timeout: 45000 }
  );

  const runtime = await page.evaluate(() => ({
    ready: globalThis.__PIECEPACE_READY__ === true,
    domMarker: document.documentElement.dataset.piecepaceReady ?? "",
    canvasCount: document.querySelectorAll("canvas").length,
  }));

  if (!runtime.ready || runtime.domMarker !== "true" || runtime.canvasCount < 1) {
    throw new Error(`Runtime readiness contract failed: ${JSON.stringify(runtime)}`);
  }

  const buildInfo = await page.evaluate(async () => {
    const response = await fetch(
      `build-info.json?cache_bust=${Date.now()}`,
      { cache: "no-store" }
    );
    if (!response.ok) {
      throw new Error(`build-info.json returned ${response.status}`);
    }
    return await response.json();
  });

  if (expectedSha && buildInfo.sha !== expectedSha) {
    throw new Error(
      `Build SHA mismatch: expected ${expectedSha}, got ${buildInfo.sha}`
    );
  }

  if (pageErrors.length > 0) {
    throw new Error(`Browser page errors: ${pageErrors.join(" | ")}`);
  }

  console.log(
    `PASS web_runtime_ready_smoke: ready=${runtime.ready} canvas=${runtime.canvasCount} sha=${buildInfo.sha}`
  );
} finally {
  await browser.close();
}
