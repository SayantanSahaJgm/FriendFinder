Pod::Spec.new do |s|
  s.name         = "BleAdvertiser"
  s.version      = "0.1.0"
  s.summary      = "Local BleAdvertiser native module for FriendFinder mobile (local copy)"
  s.license      = { :type => 'MIT' }
  s.author       = { "FriendFinder" => "dev@local" }
  s.platform     = :ios, '11.0'
  s.source       = { :path => '.' }
  s.source_files = 'BleAdvertiser/*.{h,m,swift}'
  s.dependency 'React'
end
