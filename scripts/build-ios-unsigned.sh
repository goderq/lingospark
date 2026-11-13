#!/usr/bin/env bash
set -euo pipefail

if [[ "$(uname -s)" != Darwin ]]; then
  echo 'This script requires macOS with Xcode.' >&2
  exit 1
fi

cd "$(dirname "$0")/.."
test -d ios/LingoSpark.xcworkspace
mkdir -p artifacts

xcodebuild \
  -workspace ios/LingoSpark.xcworkspace \
  -scheme LingoSpark \
  -configuration Release \
  -sdk iphoneos \
  -destination 'generic/platform=iOS' \
  -derivedDataPath ios/build \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGN_IDENTITY='' \
  build 2>&1 | tee artifacts/xcodebuild.log

app_path=ios/build/Build/Products/Release-iphoneos/LingoSpark.app
test -f "$app_path/LingoSpark"
test -f "$app_path/main.jsbundle"
version=$(node -p 'require("./app.json").expo.version')
build_number=$(node -p 'require("./app.json").expo.ios.buildNumber')
package_dir=$(mktemp -d "${TMPDIR:-/tmp}/lingospark-ipa.XXXXXX")
mkdir -p "$package_dir/Payload"
ditto "$app_path" "$package_dir/Payload/LingoSpark.app"
ipa_path="$PWD/artifacts/LingoSpark-${version}-${build_number}-unsigned.ipa"
ditto -c -k --sequesterRsrc --keepParent "$package_dir/Payload" "$ipa_path"
unzip -t "$ipa_path"
shasum -a 256 "$ipa_path"
echo "IPA ready: $ipa_path"
