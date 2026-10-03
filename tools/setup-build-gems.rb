# Unpack build dependencies inside the checkout, without gem installation hooks.
# Run via: node tools/project-ruby.cjs tools/setup-build-gems.rb
require 'net/http'
require 'rubygems/package'
require 'fileutils'
$stdout.sync = true
gems = {
  'jekyll'=>'3.10.0', 'addressable'=>'2.8.7', 'public_suffix'=>'5.1.1',
  'safe_yaml'=>'1.0.5', 'liquid'=>'4.0.4', 'kramdown'=>'2.4.0',
  'kramdown-parser-gfm'=>'1.1.0', 'rexml'=>'3.4.4', 'colorator'=>'1.1.0',
  'i18n'=>'1.14.7', 'concurrent-ruby'=>'1.3.5', 'pathutil'=>'0.16.2',
  'forwardable-extended'=>'2.6.0', 'mercenary'=>'0.3.6', 'rouge'=>'3.30.0',
  'jekyll-sass-converter'=>'1.5.2', 'sass'=>'3.7.4', 'sass-listen'=>'4.0.0',
  'jekyll-paginate'=>'1.1.0', 'jekyll-sitemap'=>'1.4.0', 'jekyll-feed'=>'0.17.0',
  'jekyll-redirect-from'=>'0.16.0', 'jekyll-gist'=>'1.5.0', 'octokit'=>'4.25.1',
  'sawyer'=>'0.9.2', 'faraday'=>'1.10.4', 'faraday-net_http'=>'1.0.2',
  'multipart-post'=>'2.4.1', 'ruby2_keywords'=>'0.0.5', 'tzinfo'=>'2.0.6',
  'tzinfo-data'=>'1.2025.2', 'webrick'=>'1.9.1',
  'faraday-multipart'=>'1.1.1', 'faraday-retry'=>'1.0.3',
  'faraday-em_http'=>'1.0.0', 'faraday-em_synchrony'=>'1.0.0',
  'faraday-excon'=>'1.1.0', 'faraday-httpclient'=>'1.0.1',
  'faraday-net_http_persistent'=>'1.2.0', 'faraday-patron'=>'1.0.0', 'faraday-rack'=>'1.0.0'
}
root = File.expand_path('..', __dir__)
cache = File.join(root, '.tools', 'build-gems')
FileUtils.mkdir_p(cache)
gems.each do |name, version|
  target = File.join(cache, "#{name}-#{version}")
  next if File.directory?(File.join(target, 'lib'))
  uri = URI("https://rubygems.org/downloads/#{name}-#{version}.gem")
  response = Net::HTTP.start(uri.host, uri.port, use_ssl: true, open_timeout: 20, read_timeout: 30) { |h| h.get(uri.request_uri) }
  raise "#{uri}: #{response.code}" unless response.is_a?(Net::HTTPSuccess)
  archive = File.join(cache, "#{name}-#{version}.gem")
  File.binwrite(archive, response.body)
  Gem::Package.new(archive).extract_files(target)
  puts "Unpacked #{name} #{version}"
end
