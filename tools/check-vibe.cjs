// Browser integration checks against a real Jekyll preview build.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const validation = path.join(root, '.validation');
const temp = path.join(validation, 'tmp');
fs.mkdirSync(temp, { recursive: true });
// Scope browser artifacts and temporary files to this process and checkout.
process.env.TEMP = temp;
process.env.TMP = temp;
process.env.TMPDIR = temp;
const { chromium } = require(path.join(root, '.tools/browser/node_modules/playwright-core'));
const site = path.join(validation, 'preview');
const prefix = '/HuaTang.github.io';
const origin = 'http://127.0.0.1:4000';
const base = origin + prefix;
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.xml':'application/xml', '.woff2':'font/woff2', '.woff':'font/woff', '.mp3':'audio/mpeg' };
const server = http.createServer((req, res) => {
  let relative;
  try { relative = decodeURIComponent(new URL(req.url, origin).pathname); }
  catch { res.writeHead(400).end(); return; }
  if (!relative.startsWith(prefix + '/')) { res.writeHead(404).end(); return; }
  let target = path.resolve(site, '.' + relative.slice(prefix.length));
  if (target !== site && !target.startsWith(site + path.sep)) { res.writeHead(403).end(); return; }
  try {
    if (fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
    res.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream' });
    fs.createReadStream(target).pipe(res);
  } catch { res.writeHead(404).end(); }
});
const errors = [];
async function main() {
  await new Promise(resolve => server.listen(4000, '127.0.0.1', resolve));
  const context = await chromium.launchPersistentContext(path.join(validation, 'edge-profile'), {
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    headless: true, viewport: { width: 1440, height: 1000 },
    args: ['--no-first-run', '--no-default-browser-check', '--disable-crash-reporter', '--disable-breakpad', '--disable-background-networking', '--window-size=1440,1000']
  });
  try {
    await context.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
    const page = context.pages()[0];
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => { if (r.status() >= 400 && /vibe-lab|vibe-project/.test(r.url())) errors.push(`${r.status()} ${r.url()}`); });
    await page.goto(base + '/vibe-lab/');
    await page.locator('[data-vibe-ready="true"]').waitFor();
    const cards = page.locator('[data-vibe-project]');
    const count = async () => Number(await page.locator('[data-vibe-count]').innerText());
    const reset = async () => { const b = page.locator('[data-vibe-filters] [data-vibe-reset]'); if (await b.isEnabled()) await b.click(); };
    const filter = (key, value) => page.locator(`[data-vibe-filters] button[data-vibe-filter="${key}"][data-vibe-value="${value}"]`);
    assert.equal(await cards.count(), 5);
    assert.equal(await count(), 5);
    assert.equal(await page.locator('.vibe-card--pinned').count(), 1);
    assert.equal(await page.locator('.sidebar [data-vibe-filters]').count(),1,'Filters belong below the author profile');
    assert.equal(await page.locator('article.page [data-vibe-filters]').count(),0);
    const scholarBox = await page.locator('.author__urls a').filter({hasText:'Google Scholar'}).boundingBox();
    const filtersBox = await page.locator('[data-vibe-filters]').boundingBox();
    assert(filtersBox.y > scholarBox.y + scholarBox.height,'Filter panel follows Google Scholar');
    const query = page.locator('[data-vibe-query]');
    const titleBox = await page.locator('h1').boundingBox();
    const searchBox = await query.boundingBox();
    assert(searchBox.x > titleBox.x + titleBox.width && Math.abs(searchBox.y+searchBox.height/2-titleBox.y-titleBox.height/2)<10,'Search and title share one row');
    const cases = [
      [[['project_type','tool']],4], [[['project_type','prototype']],1],
      [[['status','ongoing']],2], [[['status','maintenance']],3],
      [[['source_model','open_source']],4], [[['source_model','closed_source']],0],
      [[['project_type','tool'],['source_model','open_source'],['status','maintenance']],3],
      [[['project_type','prototype'],['status','maintenance']],0],
      [[['source_model','open_source'],['status','ongoing']],1]
    ];
    for (const [choices, expected] of cases) {
      await reset();
      for (const [key, value] of choices) await filter(key,value).click();
      assert.equal(await count(), expected, JSON.stringify(choices));
      assert.equal(await page.locator('[data-vibe-project]:visible').count(), expected);
      assert.equal(await page.locator('[data-vibe-empty]').isVisible(), expected === 0);
      assert.equal(await page.locator('.vibe-card--pinned').isVisible(), true);
    }
    await reset();
    await filter('status','ongoing').click();
    await filter('status','ongoing').click();
    assert.equal(await count(), 5, 'Repeated selection clears its facet');
    await page.locator('[data-vibe-title="Paper Polish"] [data-vibe-filter="source_model"]').click();
    assert.equal(await count(), 4, 'Card badge filters');
    await page.locator('#lang-toggle').click();
    for (let i=0; i<3; i++) await page.locator('#theme-toggle').click();
    assert.equal(await count(), 4, 'Theme/language changes preserve filters');
    await reset();
    await filter('project_type','prototype').focus();
    await page.keyboard.press('Enter');
    assert.equal(await count(), 1, 'Keyboard filtering');
    await reset();
    // Search only the bilingual titles and summaries, never tags or body content.
    const searches = [
      ['paper',1], ['PAPER',1], ['ＰＡＰＥＲ',1], ['train tickets',1],
      ['桌面工作台',1], ['academic feedback',1], ['  feedback   academic  ',1],
      ['hotel',1], ['酒店',1], ['subway',1], ['公交',1],
      ['arxiv',0], ['Ultra',0], ['OpenSource',0], ['Maintenance',0],
      ['zzzz-no-matches',0], ['<img src=x onerror=alert(1)>',0]
    ];
    for (const [text, expected] of searches) {
      await query.fill(text);
      assert.equal(await count(),expected,text);
      assert.equal(await page.locator('[data-vibe-list] [data-vibe-entry]:visible').count(),expected,text);
      assert.equal(await page.locator('[data-vibe-total]').innerText(),'6');
      assert.equal(await page.locator('[data-vibe-pinned]').isVisible(),false);
      assert.equal(await page.locator('[data-vibe-empty]').isVisible(),expected===0);
    }
    await query.fill('e');
    assert.equal(await count(),6);
    assert.deepEqual(await page.locator('[data-vibe-list] [data-vibe-entry]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-vibe-title'))),['Autoresearch Plugin','CN-travel MCP','Experience','Paper Polish','Podcast Translation Agent Workflow','Research & Working Skills'],'Experience has ordinary alphabetical placement during search');
    assert.equal(await page.locator('.vibe-card--pinned').count(),0);
    assert.equal(await page.locator('[data-vibe-pin]').isVisible(),false);
    await query.fill('experience');
    assert.equal(await count(),1);
    assert.equal(await page.locator('[data-vibe-list] [data-kind="experience"]').isVisible(),true);
    await filter('status','maintenance').click();
    assert.equal(await count(),0,'Experience follows active facets during search');
    await reset();
    assert.equal(await query.inputValue(),'experience','Clearing facets retains the search');
    assert.equal(await count(),1);
    await query.fill('workflow');
    await filter('status','ongoing').click();
    assert.equal(await count(),0,'Search intersects with tags');
    await page.locator('[data-vibe-reset-all]').click();
    assert.equal(await count(),5);
    assert.equal(await query.inputValue(),'');
    assert.equal(await page.locator('[data-vibe-pinned] [data-kind="experience"]').count(),1);
    await query.fill('   ');
    assert.equal(await page.locator('.vibe-card--pinned').count(),1,'Whitespace does not start search');
    assert.equal(await page.locator('[data-vibe-total]').innerText(),'5');
    await query.fill('paper');
    await filter('source_model','open_source').click();
    await page.locator('#lang-toggle').click();
    const searchLanguage = (await page.locator('#lang-toggle').innerText())==='ZH'?'zh':'en';
    assert.equal(await query.getAttribute('placeholder'),await query.getAttribute('data-placeholder-'+searchLanguage));
    for(let i=0;i<3;i++) await page.locator('#theme-toggle').click();
    assert.equal(await query.inputValue(),'paper');
    assert.equal(await count(),1,'Search and tags survive theme/language changes');
    await page.locator('[data-vibe-clear-search]').click();
    assert.equal(await count(),4,'Clearing search retains facets');
    assert.equal(await page.locator('.vibe-card--pinned').count(),1);
    await reset();
    await query.fill('paper');
    await query.press('Escape');
    assert.equal(await query.inputValue(),'');
    assert.equal(await count(),5);
    assert.equal(await page.locator('[data-vibe-entry]').count(),6,'Search transitions never duplicate entries');
    // Whole-page captures can trigger resize events; take them after interactions.
    await query.fill('e');
    await page.screenshot({path:path.join(validation,'index-search.png'),fullPage:true,animations:'disabled'});
    await page.evaluate(() => { localStorage.setItem('theme','light'); localStorage.setItem('lang','en'); });
    await page.reload();
    const artwork = page.locator('[data-vibe-entry] .card-art img');
    assert.equal(await artwork.count(),6,'Every Vibe Lab entry has an illustration');
    assert.equal(new Set(await artwork.evaluateAll(nodes=>nodes.map(n=>n.src))).size,6,'Distinct entry artwork');
    for (const img of await artwork.all()) {
      await img.evaluate(el=>{el.loading='eager';return el.decode();});
      assert.equal(await img.getAttribute('alt'),'','Decorative artwork has no spoken label');
      assert.equal(await img.evaluate(el=>el.naturalWidth),960);
    }
    for (const theme of ['light','dark','firework']) {
      await page.evaluate(theme=>document.documentElement.setAttribute('data-theme',theme),theme);
      await page.locator('article.page').screenshot({path:path.join(validation,'index-cards-'+theme+'.png'),animations:'disabled'});
    }
    await page.evaluate(()=>document.documentElement.setAttribute('data-theme','light'));
    await page.screenshot({path:path.join(validation,'index-desktop.png'),fullPage:true,animations:'disabled'});
    const slugs = ['experience','research-working-skills','cn-travel-mcp','podcast-translation','paper-polish','autoresearch-plugin'];
    for (const slug of slugs) {
      const response = await page.goto(base + '/vibe-lab/' + slug + '/');
      assert.equal(response.status(), 200, slug);
      assert.equal(await page.locator('h1').count(), 1, slug);
      assert.equal(await page.locator('[data-vibe-filters], [data-vibe-query]').count(),0,'Subpages do not inherit index controls');
      assert.equal(await page.locator('meta[property="article:published_time"]').count(), 0, 'No fabricated publication date');
      assert.equal(await page.locator('.vibe-content video').count(), 0, 'No video until supplied');
      const details = page.locator('.vibe-content details');
      assert.equal(await page.locator('.vibe-content details[open]').count(), 0);
      if (['experience','autoresearch-plugin'].includes(slug)) {
        assert.equal((await page.locator('.vibe-content').innerText()).trim(),'');
      } else {
        assert.equal(await details.count(), slug === 'research-working-skills' ? 7 : 2);
        for (const summary of await details.locator('summary').all()) await summary.click();
        await details.first().locator('summary').focus();
        await page.keyboard.press('Enter');
        assert.equal(await details.first().getAttribute('open'), null, 'Native keyboard collapse');
        await page.keyboard.press('Space');
        assert.notEqual(await details.first().getAttribute('open'), null, 'Native keyboard expansion');
        const openCount = await page.locator('.vibe-content details[open]').count();
        await page.locator('#lang-toggle').click();
        await page.locator('#theme-toggle').click();
        assert.equal(await page.locator('.vibe-content details[open]').count(), openCount, 'State survives language/theme change');
        for (const img of await page.locator('.vibe-diagram img:visible, .vibe-podcast-preview img:visible').all()) {
          await img.scrollIntoViewIfNeeded();
          await img.evaluate(el => el.decode());
          assert.equal(await img.evaluate(el => el.naturalWidth > 0),true);
        }
        if (slug === 'research-working-skills') {
          assert.equal(await page.locator('.vibe-links a[href="https://github.com/Ytang520/my-skills"]').isVisible(), true);
        }
        if (slug === 'paper-polish') {
          const download = 'https://github.com/Ytang520/paper-polish_interactive_product/releases/download/v0.1.0/PaperPolish-1.0.0-portable.exe';
          assert.equal(await page.locator(`.vibe-links a[href="${download}"]`).isVisible(),true);
          assert.match(await page.locator('.vibe-platform').innerText(),/Windows/);
          assert.match(await page.locator('.vibe-platform').innerText(),/macOS/);
          assert.match(await page.locator('.vibe-platform').innerText(),/Linux/);
          assert.match(await page.locator('.vibe-diagram img:visible').getAttribute('src'),/paperpolish-product-intro\.png$/);
        }
        if (slug === 'cn-travel-mcp') {
          const flowFiles = [];
          for (let i=0;i<2;i++) {
            const flowImage = page.locator('.vibe-diagram img:visible');
            await flowImage.evaluate(el=>el.decode());
            flowFiles.push((await flowImage.getAttribute('src')).split('/').pop());
            await page.locator('#lang-toggle').click();
          }
          assert.deepEqual(flowFiles.sort(),['cn-travel-workflow-v2-en.png','cn-travel-workflow-v2-zh.png']);
        }
        if (slug === 'podcast-translation') {
          const podcastUrl = 'https://www.xiaoyuzhoufm.com/podcast/6993470f11391268fd6847a7';
          assert.equal(await page.locator(`.vibe-links a[href="${podcastUrl}"]`).isVisible(), true);
          for (let i = 0; i < 2; i++) {
            const preview = page.locator('.vibe-podcast-preview a:visible');
            assert.equal(await preview.count(), 1, 'One preview in the active language');
            assert.equal(await preview.getAttribute('href'), podcastUrl);
            await preview.locator('img').evaluate(img => img.decode());
            assert((await preview.locator('img').getAttribute('alt')).trim(), 'Preview has alternative text');
            await page.locator('#lang-toggle').click();
          }
        }
        await page.evaluate(() => window.scrollTo(0,0));
        if (['paper-polish','cn-travel-mcp','research-working-skills','podcast-translation'].includes(slug)) await page.screenshot({path:path.join(validation,slug+'-desktop.png'),fullPage:true,animations:'disabled'});
      }
      await page.setViewportSize({width:375,height:812});
      await page.evaluate(() => Promise.all(document.getAnimations().filter(a=>a.effect.getComputedTiming().endTime!==Infinity).map(a=>a.finished.catch(()=>{}))));
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      if (overflow) {
        console.error(await page.locator('body *').evaluateAll(nodes => nodes.filter(n=>n.getBoundingClientRect().right>innerWidth+1).map(n=>({tag:n.tagName,class:n.className,right:n.getBoundingClientRect().right,text:n.textContent.trim().slice(0,90)})).slice(-15)));
        await page.screenshot({path:path.join(validation,slug+'-overflow.png'),fullPage:true,animations:'disabled'});
      }
      assert.equal(overflow,false,slug + ' should not overflow the mobile viewport');
      if (['paper-polish','cn-travel-mcp','podcast-translation'].includes(slug)) await page.screenshot({path:path.join(validation,slug+'-mobile.png'),fullPage:true,animations:'disabled'});
      await page.setViewportSize({width:1440,height:1000});
      assert.equal(await page.locator('.vibe-back').getAttribute('href'),base+'/vibe-lab/');
    }
    // Keep filters hidden and content navigable without JavaScript.
    const nojs = await context.browser().newContext({javaScriptEnabled:false,viewport:{width:375,height:812}});
    await nojs.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
    const fallback = await nojs.newPage();
    await fallback.goto(base+'/vibe-lab/');
    assert.equal(await fallback.locator('[data-vibe-project]:visible').count(),5);
    assert.equal(await fallback.locator('[data-vibe-filters]').isVisible(),false);
    assert.equal(await fallback.locator('[data-vibe-search-controls]').isVisible(),false);
    assert.equal(await fallback.locator('[data-kind="experience"]').isVisible(),true);
    await fallback.goto(base+'/vibe-lab/paper-polish/');
    await fallback.locator('details summary').last().click();
    assert.equal(await fallback.locator('.vibe-diagram').isVisible(),true);
    await nojs.close();
    await page.goto(base+'/');
    assert.equal(await page.locator('[data-vibe-filters], [data-vibe-query]').count(),0,'Other pages do not receive Vibe controls');
    await page.setViewportSize({width:375,height:812});
    await page.goto(base+'/vibe-lab/');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth+1),false);
    const panel = page.locator('[data-vibe-filter-panel]');
    assert.equal(await panel.getAttribute('open'),null,'Mobile filters start collapsed');
    await panel.locator('summary').click();
    await filter('status','ongoing').click();
    assert.equal(await count(),2,'Mobile sidebar buttons work');
    await reset();
    await panel.locator('summary').click();
    await query.fill('experience');
    assert.equal(await count(),1,'Mobile search includes Experience');
    await query.press('Escape');
    await page.evaluate(() => window.scrollTo(0,0));
    await page.screenshot({path:path.join(validation,'index-mobile.png'),fullPage:true,animations:'disabled'});
    for(const width of [320,768,925,1024,1440]) {
      await page.setViewportSize({width,height:900});
      await page.evaluate(() => Promise.all(document.getAnimations().filter(a=>a.effect.getComputedTiming().endTime!==Infinity).map(a=>a.finished.catch(()=>{}))));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth>innerWidth+1),false,'Index width '+width);
      const h = await page.locator('h1').boundingBox(), s = await query.boundingBox();
      assert(Math.abs(s.y+s.height/2-h.y-h.height/2)<10,'Search remains beside the title at '+width);
      if(width>=925) {
        assert.deepEqual(await page.locator('[data-vibe-filters] button[data-vibe-filter]').evaluateAll(buttons=>buttons.filter(b=>b.scrollWidth>b.clientWidth+1).map(b=>b.textContent.trim())),[],'Sidebar labels fit at '+width);
      }
    }
    // Inspect SVG text bounds independently of the page's image scaling.
    await page.setViewportSize({width:1200,height:1200});
    for (const filename of fs.readdirSync(path.join(root,'assets/images/vibe-lab')).filter(n=>n.endsWith('.svg'))) {
      await page.goto(base+'/assets/images/vibe-lab/'+filename);
      const outOfBounds = await page.locator('text').evaluateAll(nodes => nodes.filter(node => {
        const b=node.getBBox(), v=node.ownerSVGElement.viewBox.baseVal;
        return b.x<0 || b.y<0 || b.x+b.width>v.width || b.y+b.height>v.height;
      }).map(n=>n.textContent));
      assert.deepEqual(outOfBounds,[],filename);
      const clippedLabels = await page.locator('[data-flow-box]').evaluateAll(groups => groups.flatMap(g=>{
        const rect=g.querySelector('rect').getBBox();
        return Array.from(g.querySelectorAll('text')).filter(t=>{const b=t.getBBox();return b.x<rect.x+7 || b.x+b.width>rect.x+rect.width-7;}).map(t=>t.textContent);
      }));
      assert.deepEqual(clippedLabels,[],filename+' node text must fit');
      if (filename.startsWith('paper-polish')) await page.screenshot({path:path.join(validation,filename+'.png'),animations:'disabled'});
    }
    assert.deepEqual(errors,[], 'No page errors or new asset failures');
    fs.writeFileSync(path.join(validation,'browser-results.json'), JSON.stringify({passed:true,filterCases:cases.length,searchCases:searches.length,subpages:slugs.length,cardImages:6,svgAssets:fs.readdirSync(path.join(root,'assets/images/vibe-lab')).filter(n=>n.endsWith('.svg')).length,errors},null,2));
    console.log('PASS: sidebar layout, search scope, Experience ordering, combined filters, state, six subpages, responsive/no-JS behavior, SVG bounds, and runtime errors.');
  } catch (error) {
    const activePage = context.pages()[0];
    if (activePage) {
      await activePage.screenshot({path:path.join(validation,'browser-failure.png'),fullPage:true,animations:'disabled'}).catch(()=>{});
    }
    throw error;
  } finally { await context.close(); }
}
main().catch(error => { console.error(error); process.exitCode=1; }).finally(()=>server.close());
