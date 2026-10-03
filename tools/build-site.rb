# Build with the real Jekyll engine and unpacked, project-local Ruby libraries.
# Watch/serve native dependencies are unnecessary for a one-shot static build.
root = File.expand_path('..', __dir__)
require 'rubygems/package'
gem_root = File.join(root, '.tools/build-gems')
gem_libraries = Dir.children(gem_root).select { |name| name.end_with?('.gem') }.flat_map do |name|
  spec = Gem::Package.new(File.join(gem_root, name)).spec
  spec.require_paths.map { |p| File.join(gem_root, name.delete_suffix('.gem'), p) }
end
abort "No local gem libraries found under #{root}" if gem_libraries.empty?
gem_libraries.sort.reverse_each { |p| $LOAD_PATH.unshift(p) }
ENV['JEKYLL_NO_BUNDLER_REQUIRE'] = 'true'
require 'jekyll'
overrides = {'source'=>root, 'destination'=>File.join(root, '_site'), 'strict_front_matter'=>true}
if ARGV.include?('--preview')
  overrides.merge!('url'=>'http://127.0.0.1:4000', 'baseurl'=>'/HuaTang.github.io',
                   'destination'=>File.join(root, '.validation/preview'))
end
site = Jekyll::Site.new(Jekyll.configuration(overrides))
site.process
puts "Jekyll #{Jekyll::VERSION}: #{site.dest}"
