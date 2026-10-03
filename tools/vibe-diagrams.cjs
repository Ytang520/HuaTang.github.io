// Source for the bilingual, dependency-free workflow SVGs used by Vibe Lab.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'assets/images/vibe-lab');
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const diagrams = {};
function render(id, title, description, height, build) {
  const width = 1040;
  for (const lang of ['en', 'zh']) {
    const k = lang === 'en' ? 0 : 1;
    const edges = [], nodes = [];
    const text = (x, y, value, size = 21, color = '#243b53', weight = 500, anchor = 'middle') =>
      `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}" fill="${color}">${escape(value)}</text>`;
    const label = (x, y, pair, size = 18, rotation = 0) => {
      const item = text(x, y, pair[k], size, '#52697c');
      nodes.push(rotation ? `<g transform="rotate(${rotation} ${x} ${y})">${item}</g>` : item);
    };
    const box = (x, y, w, h, lines, accent = false) => {
      const selected = lines[k];
      nodes.push('<g data-flow-box="true">');
      nodes.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${accent ? '#e3f3ee' : '#edf3fa'}" stroke="${accent ? '#8eb9aa' : '#b6c9df'}" stroke-width="1.5"/>`);
      selected.forEach((line, i) => nodes.push(text(x + w / 2, y + h / 2 + (i - (selected.length - 1) / 2) * 28 + 7, line)));
      nodes.push('</g>');
    };
    const arrow = d => edges.push(`<path d="${d}" fill="none" stroke="#6c8599" stroke-width="2" stroke-linejoin="round" marker-end="url(#arrow)"/>`);
    const lane = (x, y, w, h, pair) => {
      edges.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20" fill="#f8fafc" stroke="#d8e2ea"/>`);
      label(x + w / 2, y + 33, pair, 20);
    };
    build({box, arrow, label, lane});
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc" lang="${lang === 'zh' ? 'zh-CN' : 'en'}">
<title id="title">${escape(title[k])}</title><desc id="desc">${escape(description[k])}</desc>
<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#6c8599"/></marker></defs>
<rect width="1040" height="${height}" rx="20" fill="#fff"/>
<g font-family="Segoe UI, Microsoft YaHei, PingFang SC, sans-serif">${text(44, 49, title[k], 27, '#18344c', 650, 'start')}
${edges.join('\n')}
${nodes.join('\n')}
</g></svg>\n`;
    fs.writeFileSync(path.join(output, `${id}-${lang}.svg`), svg);
  }
  diagrams[id] = {width, height, alt_en: description[0], alt_zh: description[1]};
}
fs.mkdirSync(output, {recursive: true});
render('skill-arxiv', ['arXiv · Search to full text', 'arXiv · 从检索到全文'],
  ['An arXiv ID retrieves a paper directly; titles and topics use fuzzy search; keyword searches require query confirmation before results, metadata, and PDFs.', 'arXiv ID 直接定位论文；标题与主题走模糊检索；关键词检索先确认检索式，再获取结果、元数据与 PDF。'], 660,
  ({box, arrow, label}) => {
    box(310,90,420,70,[['Identify the research input'],['识别研究输入']]);
    arrow('M520 160 V192 H195 V220'); arrow('M520 192 V220'); arrow('M520 192 H845 V220');
    box(55,220,280,80,[['arXiv ID'],['arXiv ID']]);
    box(380,220,280,80,[['Title or topic'],['论文标题或主题']]);
    box(705,220,280,80,[['Exact keywords'],['精确关键词']]);
    arrow('M195 300 V340'); arrow('M520 300 V340'); arrow('M845 300 V340');
    box(55,340,280,85,[['Direct retrieval'],['直接获取']]);
    box(380,340,280,85,[['Fuzzy search'],['模糊检索']]);
    box(705,340,280,85,[['Confirm query', 'then search'],['确认检索式', '再执行检索']]);
    arrow('M195 425 V468 H520 V510'); arrow('M520 425 V510'); arrow('M845 425 V468 H520');
    box(255,510,530,80,[['Inspect results · metadata · PDFs'],['检查结果 · 元数据 · PDF']],true);
    label(520,630,['Batch retrieval can resume after interruption.','批量获取支持中断后继续。']);
  });
render('skill-travel', ['China Travel MCP · Installation', 'China Travel MCP · 安装与接入'],
  ['Inspect an existing installation, reuse it if usable or configure the client, project dependencies and visible browser; build and verify the gateway before using train, flight, map and taxi tools.', '检查现有安装，可用则复用，否则配置客户端、项目依赖与可见浏览器；构建并验证网关，再使用火车、航班、地图与打车工具。'], 700,
  ({box, arrow, label}) => {
    box(310,85,420,70,[['Inspect current installation'],['检查现有安装']]);
    arrow('M520 155 V185 H245 V230'); arrow('M520 185 H775 V230');
    label(245,213,['Already usable','已可用']); label(775,213,['Setup required','需要配置']);
    box(55,230,380,90,[['Reuse client configuration'],['复用客户端配置']],true);
    box(585,230,400,90,[['Choose the MCP client', 'prepare project dependencies'],['选择 MCP 客户端', '准备项目依赖']]);
    arrow('M785 320 V360');
    box(585,360,400,90,[['Configure Edge or Chrome', 'visible, minimized window'],['配置 Edge 或 Chrome', '可见窗口最小化运行']]);
    arrow('M245 320 V480 H520 V510'); arrow('M785 450 V480 H520');
    box(270,510,500,80,[['Build as needed · verify gateway', 'Configuration / health / tool checks'],['按需构建 · 验证网关', '配置 / 健康状态 / 工具检查']]);
    arrow('M520 590 V623');
    box(155,623,730,55,[['Train · direct flights · map · taxi estimates'],['火车 · 直达航班 · 地图 · 打车估价']],true);
  });
render('skill-scholar', ['Google Scholar · Research operations', 'Google Scholar · 研究操作'],
  ['Check browser access, resolve login or verification manually if needed, route the task to search, citation exploration, full text or export, and return structured results.', '检查浏览器访问状态，必要时由用户完成登录或验证，再路由至搜索、引用追踪、全文入口或导出，输出结构化结果。'], 640,
  ({box, arrow, label}) => {
    box(280,85,480,75,[['Check browser and access status'],['检查浏览器与访问状态']]);
    arrow('M760 122 H805');
    box(805,85,205,100,[['User handles', 'verification'],['用户处理', '访问验证']]);
    arrow('M905 185 V212 H745 V160'); label(885,239,['If prompted','出现提示时'],16);
    arrow('M520 160 V250');
    box(280,250,480,70,[['Route the requested operation'],['识别并路由所需操作']]);
    arrow('M520 320 V350 H195 V385'); arrow('M520 350 V385'); arrow('M520 350 H845 V385');
    box(55,385,280,100,[['Search & filters', 'Pagination'],['搜索与筛选', '翻页']]);
    box(380,385,280,100,[['Cited-by exploration', 'Full-text links'],['引用追踪', '全文入口']]);
    box(705,385,280,100,[['Citation export', 'Troubleshooting'],['引用导出', '排障']]);
    arrow('M195 485 V520 H520 V550'); arrow('M520 485 V550'); arrow('M845 485 V520 H520');
    box(280,550,480,65,[['Return structured results'],['返回结构化结果']],true);
  });
render('skill-review', ['Literature Review · From question to synthesis', '文献综述 · 从问题到综合分析'],
  ['Define scope, collect and deduplicate, screen titles and abstracts, optionally check the first two PDF pages, read selected papers in full, then synthesize the review and reading recommendations.', '确定范围，收集去重，筛选标题和摘要，可选结合 PDF 前两页复筛，精读入选论文，最后形成综述和推荐阅读。'], 850,
  ({box, arrow, label}) => {
    const rows = [
      [['Define scope and screening criteria'],['确定范围与筛选标准']],
      [['Collect papers and deduplicate'],['收集论文与去重']],
      [['Screen titles and abstracts'],['筛选标题与摘要']],
      [['Optional: check the first two PDF pages'],['可选：结合 PDF 前两页复筛']],
      [['Read selected papers in full'],['全文精读入选论文']],
      [['Synthesize findings and reading recommendations'],['综合结论与推荐阅读']]
    ];
    rows.forEach((lines,i) => { const y=90+i*116; box(180,y,680,75,lines,i===5); if(i<5) arrow(`M520 ${y+75} V${y+116}`); });
    label(520,803,['Optional output: a map of research development.','可选输出：研究发展脉络图。']);
  });
render('skill-pdf', ['PDF · Document tasks', 'PDF · 文档处理'],
  ['Identify the task and document type, select creation, extraction, editing, forms or OCR, process the document and validate the output.', '识别任务与文档类型，选择新建、提取、编辑、表单或 OCR，处理文档并验证输出。'], 590,
  ({box, arrow}) => {
    box(250,90,540,75,[['Identify task and document type'],['识别任务与文档类型']]);
    const centers=[130,325,520,715,910];
    const labels=[ [['Create', 'a document'],['新建文档']], [['Extract', 'text / tables'],['提取文本', '与表格']], [['Merge / edit', 'pages'],['合并与', '编辑页面']], [['Fill', 'forms'],['填写表单']], [['OCR', 'scanned pages'],['扫描件 OCR']] ];
    centers.forEach((x,i) => { arrow(`M520 165 V205 H${x} V245`); box(x-87,245,174,100,labels[i]); arrow(`M${x} 345 V385 H520 V420`); });
    box(250,420,540,75,[['Process and validate the output'],['执行处理并验证输出']],true);
    box(250,525,540,45,[['Deliver usable files or extracted data'],['交付可用文件或提取数据']],true);
    arrow('M520 495 V525');
  });
render('skill-xiaohongshu', ['Xiaohongshu · Visible content', '小红书 · 可见内容提取'],
  ['Start from keywords or a note link, inspect access and visible content, search or open the note, optionally read top-level comments, then return structured content. Login and verification require user action.', '从关键词或笔记链接出发，检查访问与可见内容，搜索或打开笔记，按需读取顶层评论，再输出结构化内容；登录与验证由用户完成。'], 740,
  ({box, arrow, label}) => {
    box(100,85,340,70,[['Keywords'],['关键词']]); box(600,85,340,70,[['Note link'],['笔记链接']]);
    arrow('M270 155 V185 H520 V215'); arrow('M770 155 V185 H520');
    box(250,215,540,90,[['Check access and visible content', 'User completes login / verification'],['检查访问状态与可见内容', '由用户完成登录 / 验证']]);
    arrow('M520 305 V335 H270 V375'); arrow('M520 335 H770 V375');
    box(100,375,340,80,[['Search and select notes'],['搜索并选择笔记']]);
    box(600,375,340,80,[['Open the supplied note'],['打开指定笔记']]);
    arrow('M270 455 V485 H520 V520'); arrow('M770 455 V485 H520');
    box(220,520,600,80,[['Extract visible text and metadata', 'Optional: top-level comments'],['提取可见正文与元数据', '可选：顶层评论']]);
    arrow('M520 600 V640');
    box(250,640,540,65,[['Return structured content'],['输出结构化内容']],true);
  });
function pngDimensions(file) {
  const png = fs.readFileSync(path.join(output, file));
  if (png.toString('ascii', 1, 4) !== 'PNG') throw new Error(`Invalid PNG: ${file}`);
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}
for (const [id, file, source, alt_en, alt_zh] of [
  ['paper-polish','paperpolish-product-intro.png','https://github.com/Ytang520/paper-polish_interactive_product/blob/main/docs/assets/paperpolish-product-intro.png','PaperPolish README illustration: compare source text and polished output, select editing requirements, and iterate from input through polishing, feedback, and completion.','PaperPolish README 介绍图：并排查看原文与润色结果，勾选修改要求，按输入原文、AI 润色、反馈调整、确认定稿的流程迭代。'],
  ['podcast','podcast-workflow.png','https://github.com/Ytang520/Podcast_translation/blob/main/resources/presentation_flowchart.png','Original podcast workflow: transcription, terminology-aware translation and summarization, voice synthesis, and Chinese audio output.','播客原始流程图：转写、结合术语的翻译与总结、语音合成及中文音频输出。']
]) {
  diagrams[id] = { file, source, ...pngDimensions(file), alt_en, alt_zh };
}
const travelEn = 'cn-travel-workflow-v2-en.png';
const travelZh = 'cn-travel-workflow-v2-zh.png';
const travelZhSize = pngDimensions(travelZh);
diagrams['cn-travel'] = {
  file_en: travelEn, file_zh: travelZh,
  ...pngDimensions(travelEn), width_zh: travelZhSize.width, height_zh: travelZhSize.height,
  source: 'https://github.com/Ytang520/China-Travel-Planning-MCPs-All-in-One/blob/main/docs/assets/workflow.png',
  alt_en: 'An agent uses one MCP gateway for five domains: trains, flights, hotels, maps and taxi estimates. Map lookup and subway, bus and driving routes share Amap. Results return to the agent for a travel plan; a separate agent skill handles troubleshooting.',
  alt_zh: 'Agent 通过一个 MCP 网关接入火车、航班、酒店、地图和打车估价五个域。地图查询与地铁、公交、驾车路径规划共用高德 MCP。结果返回 Agent 形成出行方案，另由 Agent skill 执行排障。'
};
fs.writeFileSync(path.join(root, '_data/vibe_diagrams.yml'), JSON.stringify(diagrams, null, 2) + '\n');
console.log('Generated six bilingual skill workflows; indexed PaperPolish and podcast originals and bilingual CN Travel images.');
