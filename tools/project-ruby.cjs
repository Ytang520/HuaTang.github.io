// Keep Ruby, gem caches, and temporary build files inside this checkout.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const local = path.join(root, '.tools');
const rubyRoot = path.join(local, 'rubyinstaller-3.3.12-1-x64');
const ruby = path.join(rubyRoot, 'bin', 'ruby.exe');
const temp = path.join(local, 'tmp');
const gems = path.join(local, 'gems');
for (const dir of [temp, gems, path.join(local, 'gem-cache')]) fs.mkdirSync(dir, { recursive: true });
// RubyInstaller's stock hook creates ProgramData/gemrc and can install MSYS
// packages. Replace that hook only in this project's downloaded portable copy.
const defaults = path.join(rubyRoot, 'lib/ruby/3.3.0/rubygems/defaults/operating_system.rb');
if (!fs.existsSync(defaults)) throw new Error('Project-local portable Ruby is missing.');
fs.writeFileSync(defaults, `require "ruby_installer/runtime"
RubyInstaller::Runtime.enable_dll_search_paths
Gem.pre_install do |installer|
  raise "Native installation disabled in project-only runtime" unless installer.spec.extensions.empty?
end
`, 'utf8');
const env = { ...process.env, GEM_HOME: gems, GEM_PATH: gems,
  GEMRC: path.join(local, 'gemrc'),
  GEM_SPEC_CACHE: path.join(local, 'gem-cache'),
  BUNDLE_USER_HOME: path.join(local, 'bundle'), BUNDLE_PATH: gems,
  TMP: temp, TEMP: temp, TMPDIR: temp, JEKYLL_ENV: 'production' };
const args = process.argv.slice(2);
const result = spawnSync(ruby, args, { cwd: root, env, stdio: 'inherit', windowsHide: true });
if (result.error) { console.error(result.error.message); process.exit(1); }
process.exit(result.status === null ? 1 : result.status);
