// Check the homepage's shared-width disclosures against the real local build.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const output = path.join(root, '.validation');
const site = path.join(output, 'preview');
const temp = path.join(output, 'tmp');
fs.mkdirSync(temp, { recursive: true });
process.env.TEMP = process.env.TMP = process.env.TMPDIR = temp;
const { chromium } = require(path.join(root, '.tools/browser/node_modules/playwright-core'));
const origin = 'http://127.0.0.1:4000';
const prefix = '/HuaTang.github.io';
const base = origin + prefix;
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const server = http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, origin).pathname); }
  catch { res.writeHead(400).end(); return; }
  if (!pathname.startsWith(prefix + '/')) { res.writeHead(404).end(); return; }
  let file = path.resolve(site, '.' + pathname.slice(prefix.length));
  if (file !== site && !file.startsWith(site + path.sep)) { res.writeHead(403).end(); return; }
  try {
    if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file += '.html';
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  } catch { res.writeHead(404).end(); }
});

async function main() {
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(4000, '127.0.0.1', resolve); });
  const context = await chromium.launchPersistentContext(path.join(output, 'home-check-profile'), {
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    headless: true, viewport: { width: 1440, height: 1100 },
    args: ['--no-first-run', '--no-default-browser-check', '--disable-crash-reporter', '--disable-breakpad', '--disable-background-networking', '--window-size=1440,1100']
  });
  const errors = [];
  try {
    await context.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
    const page = context.pages()[0];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.status() >= 400 && /home-interests|vibe-lab/.test(response.url())) errors.push(response.status() + ' ' + response.url());
    });
    await page.goto(base + '/');
    await page.evaluate(() => { localStorage.setItem('lang', 'en'); localStorage.setItem('theme', 'light'); });
    await page.reload();
    const section = page.locator('[data-home-ready="true"]');
    await section.waitFor();
    const choices = section.locator('[data-home-choice]');
    const panel = id => section.locator('#home-panel-' + id);
    const choose = id => section.locator('#home-choice-' + id);
    const settle = () => page.evaluate(() => Promise.all(document.getAnimations().filter(a => a.effect.getComputedTiming().endTime !== Infinity).map(a => a.finished.catch(() => {}))));
    const layout = async () => {
      const boxes = await choices.evaluateAll(nodes => nodes.map(node => { const b = node.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width }; }));
      assert.equal(boxes.length, 3);
      assert(boxes.every(b => Math.abs(b.y - boxes[0].y) < 1 && Math.abs(b.width - boxes[0].width) < 1), 'Three equal-width cards in one row');
      const open = section.locator('[data-home-panel][open]');
      if (await open.count()) {
        const rowBox = await section.locator('[data-home-choices]').boundingBox();
        const panelBox = await open.boundingBox();
        assert(Math.abs(rowBox.x - panelBox.x) < 1 && Math.abs(rowBox.width - panelBox.width) < 1, 'Expanded content spans the complete row');
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, 'No horizontal page overflow');
    };
    assert.equal(await section.locator('h2:visible').innerText(), 'Projects I\'m interested in');
    assert(!/Vibe-Coding Product Development|Vibe-Coding 产品开发|Blog & Podcast|博客 & 播客/.test(await page.locator('.page__content').innerText()));
    assert.equal(await section.locator('[data-home-panel][open]').count(), 0);
    assert.equal(await section.locator('.card-art img').count(),7,'Category, product and blog cards have backgrounds');
    for (const img of await section.locator('.card-art img').all()) {
      await img.evaluate(el=>{el.loading='eager';return el.decode();});
      assert.equal(await img.getAttribute('alt'),'');
      assert.equal(await img.evaluate(el=>el.naturalWidth),960);
    }
    for (const id of ['product', 'podcast', 'blog']) {
      await choose(id).click();
      assert.equal(await section.locator('[data-home-panel][open]').count(), 1);
      assert.equal(await choose(id).getAttribute('aria-expanded'), 'true');
      assert.equal(await panel(id).isVisible(), true);
      await layout();
    }
    await choose('blog').click();
    assert.equal(await section.locator('[data-home-panel][open]').count(), 0, 'Repeat click collapses');
    await choose('product').focus();
    await page.keyboard.press('Enter');
    const projects = section.locator('.home-interests__project');
    assert.deepEqual(await projects.evaluateAll(nodes => nodes.map(node => new URL(node.href).pathname)), ['cn-travel-mcp', 'research-working-skills', 'paper-polish'].map(slug => prefix + '/vibe-lab/' + slug + '/'));
    for (const href of await projects.evaluateAll(nodes => nodes.map(node => node.href))) assert.equal((await context.request.get(href)).status(), 200);
    await page.keyboard.press('Escape');
    assert.equal(await section.locator('[data-home-panel][open]').count(), 0);
    assert.equal(await choose('product').evaluate(el => el === document.activeElement), true);
    await page.keyboard.press('Space');
    assert.equal(await panel('product').isVisible(), true);
    await choose('podcast').click();
    const media = section.locator('.home-interests__media-link');
    assert.deepEqual(await media.evaluateAll(nodes => nodes.map(node => node.href)), ['https://www.xiaoyuzhoufm.com/podcast/6993470f11391268fd6847a7', 'https://github.com/Ytang520/Podcast_translation']);
    assert.equal(await section.locator('.home-interests__media-link.image-popup').count(), 0);
    for (let lang = 0; lang < 2; lang++) {
      assert.equal(await media.locator('img:visible').count(), 2);
      for (const img of await media.locator('img:visible').all()) { await img.scrollIntoViewIfNeeded(); await img.evaluate(el => el.decode()); }
      await page.locator('#lang-toggle').click();
      assert.equal(await panel('podcast').isVisible(), true, 'Language change preserves expanded category');
    }
    await choose('blog').click();
    const post = section.locator('.home-interests__post');
    assert.equal(await post.count(), 1);
    const feed = await (await context.request.get(base + '/feed.xml')).text();
    const latestUrl = feed.match(/<entry>[\s\S]*?<link[^>]*href="([^"]+)"/)[1];
    assert.equal(decodeURI(await post.getAttribute('href')), decodeURI(latestUrl), 'Latest homepage post matches the feed');
    await post.click();
    assert.equal(decodeURI(page.url()), decodeURI(latestUrl));
    await page.goBack();
    await section.waitFor();
    for (const id of ['product', 'podcast', 'blog']) {
      if (await panel(id).getAttribute('open') === null) await choose(id).click();
      await section.screenshot({ path: path.join(output, 'home-' + id + '-desktop.png'), animations: 'disabled' });
    }
    for (const theme of ['dark', 'firework', 'light']) {
      await page.evaluate(theme => document.documentElement.setAttribute('data-theme', theme), theme);
      if (await panel('product').getAttribute('open') === null) await choose('product').click();
      assert.equal(await panel('product').isVisible(), true);
      await section.screenshot({ path: path.join(output, 'home-' + theme + '.png'), animations: 'disabled' });
    }
    await page.locator('#lang-toggle').click();
    assert.equal(await section.locator('h2').innerText(), '一些出于兴趣的项目');
    await section.screenshot({ path: path.join(output, 'home-product-zh.png'), animations: 'disabled' });
    for (const width of [320, 375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1100 });
      await settle();
      for (const id of ['product', 'podcast', 'blog']) {
        if (await panel(id).getAttribute('open') === null) await choose(id).click();
        await layout();
        if (width === 375) await section.screenshot({ path: path.join(output, 'home-' + id + '-mobile.png'), animations: 'disabled' });
      }
    }
    const nojs = await context.browser().newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 1100 } });
    try {
      await nojs.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
      const fallback = await nojs.newPage();
      await fallback.goto(base + '/');
      assert.equal(await fallback.locator('[data-home-choices]').isVisible(), false);
      await fallback.locator('#home-panel-product > summary').click();
      assert.equal(await fallback.locator('.home-interests__project:visible').count(), 3, 'Native disclosure works without JavaScript');
    } finally { await nojs.close(); }
    await page.goto(base + '/vibe-lab/');
    assert.equal(await page.locator('[data-home-interests]').count(), 0);
    assert.equal(await page.locator('link[href$="home-interests.css"], script[src$="home-interests.js"]').count(), 0, 'Assets load only on the homepage');
    assert.equal(await page.locator('[data-vibe-entry]').count(), 6);
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'home-results.json'), JSON.stringify({ passed: true, categories: 3, productLinks: 3, latestPosts: 1, widths: [320, 375, 768, 1024, 1440], errors }, null, 2));
    console.log('PASS: homepage expansion, full-row width, products, latest post, podcast links/images, bilingual state, keyboard, themes, responsive layout, no-JS fallback and page isolation.');
  } catch (error) {
    const page = context.pages()[0];
    if (page) await page.screenshot({ path: path.join(output, 'home-failure.png'), fullPage: true, animations: 'disabled' }).catch(() => {});
    throw error;
  } finally { await context.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
