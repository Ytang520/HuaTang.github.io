Vibe Lab development checks

The website uses the repository's existing Jekyll / GitHub Pages setup. The
scripts here provide optional Windows checks without a system Ruby installation.
Their dependencies, browser profiles, caches, screenshots and generated sites
stay in this checkout and are excluded from publication.

For the local check runner, download the official
[RubyInstaller 3.3.12 portable archive](https://github.com/oneclick/rubyinstaller2/releases/download/RubyInstaller-3.3.12-1/rubyinstaller-3.3.12-1-x64.7z)
to `.tools/ruby.7z`, then extract it into `.tools` with `tar -xf .tools/ruby.7z -C .tools`.
The expected executable is `.tools/rubyinstaller-3.3.12-1-x64/bin/ruby.exe`.
`project-ruby.cjs` disables system configuration creation and native dependency
installation in that downloaded copy only. It does not install Ruby or change
the persistent PATH. Use an existing Node.js and Microsoft Edge installation.

```powershell
node tools/project-ruby.cjs tools/setup-build-gems.rb
npm.cmd install --prefix .tools/browser --cache .tools/npm-cache --no-audit --no-fund --ignore-scripts playwright-core@1.58.2
node tools/vibe-diagrams.cjs
node tools/project-ruby.cjs tools/build-site.rb
node tools/check-site.cjs
node tools/project-ruby.cjs tools/build-site.rb --preview
node tools/check-vibe.cjs
node tools/check-home.cjs
```

The build runner uses Jekyll 3.10.0 with the configured site plugins and local
Ruby libraries. Live server/watch native dependencies are unnecessary for this
static build. It does not reproduce the complete `github-pages` Gemfile bundle.
The preview and browser checks exercise the `/HuaTang.github.io/` path prefix.
Browser checks start a temporary server on port 4000 and close it afterward.
Screenshots and results are in `.validation`.

Project entries live in `_vibe_projects`. A blank `repo_url` or `video_url`
produces no empty link or player. When a Paper Polish video is available, use
an HTTPS URL or a site-root path such as `/assets/video/paper-polish.mp4` for
`video_url`; `video_poster` accepts the same path formats. The diagram generator
is the editable source for the bilingual SVG files and diagram metadata.

The Vibe Lab index alone has a sidebar filter panel and a title-row search box.
Search uses `title`, `title_zh`, `excerpt`, and `summary_zh`; it ignores page body
content and tag labels. Whitespace-separated keywords must all match, regardless
of case. Active search includes Experience in alphabetical order and intersects
with the selected tag facets. Clearing search restores the pinned Experience
entry and project ordering. The search and tag reset controls work independently;
the empty-state reset clears both. On smaller screens the filter panel starts
collapsed below the author profile.

The homepage's interest section is configured in `_data/home_interests.yml`.
Product cards use Vibe Lab collection metadata; the blog card takes the most
recent post by date, with `title_zh` when available. `check-home.cjs` checks the
three shared-width disclosures, link destinations, latest post against the feed,
keyboard use, bilingual state, images, themes, responsive layout and native
disclosure fallback. Its screenshots and `home-results.json` are in `.validation`.
