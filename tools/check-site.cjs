// Check production output and publication boundaries independently of the UI.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname,'..');
const site = path.join(root,'_site');
const prefix = 'https://ytang520.github.io/HuaTang.github.io';
const slugs = ['experience','research-working-skills','cn-travel-mcp','podcast-translation','paper-polish','autoresearch-plugin'];
const index = fs.readFileSync(path.join(site,'vibe-lab/index.html'),'utf8');
assert.equal((index.match(/\sdata-vibe-project(?=[\s=>])/g)||[]).length,5);
assert.equal((index.match(/data-vibe-entry\b/g)||[]).length,6);
assert(index.includes('data-vibe-query'),'Search is rendered on the index');
const sitemap = fs.readFileSync(path.join(site,'sitemap.xml'),'utf8');
const home = fs.readFileSync(path.join(site,'index.html'),'utf8');
assert(/Projects I(?:'|&#39;)m interested in/.test(home),'Homepage interest section');
assert(!home.includes('Vibe-Coding Product Development') && !home.includes('Vibe-Coding 产品开发'),'Retired homepage section');
for (const asset of ['assets/css/home-interests.css','assets/css/card-art.css','assets/js/home-interests.js','assets/images/vibe-lab/xiaoyuzhou-preview.png','assets/images/vibe-lab/podcast-workflow.png']) {
  assert(home.includes(`${prefix}/${asset}`),'Homepage asset uses production prefix: '+asset);
  assert(fs.existsSync(path.join(site,asset)),'Homepage asset exists: '+asset);
}
assert.equal((home.match(/class="home-interests__project"/g)||[]).length,3);
assert.equal((home.match(/class="home-interests__post"/g)||[]).length,1);
const cardSources = Array.from((home + index).matchAll(/src="([^"]+\/assets\/images\/card-backgrounds\/[^"/]+\.jpg)"/g), match => match[1]);
assert.equal(new Set(cardSources).size,9,'All nine card illustrations are referenced');
for (const src of cardSources) {
  assert(src.startsWith(prefix+'/assets/images/card-backgrounds/'),'Card art uses the production prefix');
  assert(fs.existsSync(path.join(site,src.slice(prefix.length))),'Card art is published');
}
for (const slug of slugs) {
  const url = `${prefix}/vibe-lab/${slug}/`;
  assert(index.includes(`href="${url}"`),`${slug} index link`);
  assert(sitemap.includes(`<loc>${url}</loc>`),`${slug} sitemap`);
  const html = fs.readFileSync(path.join(site,'vibe-lab',slug,'index.html'),'utf8');
  assert(html.includes(`href="${prefix}/vibe-lab/"`),'Back link');
  assert(!html.includes('article:published_time'),'No generated publication dates');
  assert(!html.includes('<video'),'Video remains absent until supplied');
  assert(!html.includes('Liquid Exception'),'No Liquid failures');
  for (const [,href] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (!href.includes('/assets/images/vibe-lab/')) continue;
    assert(href.startsWith(prefix+'/assets/images/vibe-lab/'),'Unexpected asset URL: '+href);
    assert(fs.existsSync(path.join(site,href.slice(prefix.length))),'Local asset exists');
  }
}
for (const filename of ['log.txt','_planning','.tools','.validation','tools','.venv','.uv-cache']) {
  assert(!fs.existsSync(path.join(site,filename)),`${filename} must not be published`);
}
const archive = fs.readFileSync(path.join(site,'collection-archive/index.html'),'utf8');
assert(!/<details\b/.test(archive),'Archive excerpts must not contain partial disclosures');
console.log('PASS: homepage assets/cards, production paths, six sitemap entries, metadata, diagram assets, blank video, clean archive excerpts, and excluded local tooling.');
