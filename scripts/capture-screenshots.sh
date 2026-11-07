#!/usr/bin/env bash
# Captures localized iPhone screenshots of iCook4U for the promo website.
#
#   website/scripts/capture-screenshots.sh            # all languages
#   website/scripts/capture-screenshots.sh en bg      # selected languages
#
# Uses the DEBUG deep-link launch arguments from AppModel.applyDebugLaunchArguments.
# Output: website/screenshots/<lang>/{home,discover,recipe,nutrition,kitchen,creami}.jpg
set -euo pipefail

export DEVELOPER_DIR="${DEVELOPER_DIR:-/Applications/Xcode26.6.app/Contents/Developer}"
DEVICE_NAME="${DEVICE_NAME:-iPhone 17 Pro}"
BUNDLE_ID="gp.dev.iCook"
WIDTH="${WIDTH:-640}"          # output width in px
WAIT="${WAIT:-4}"              # seconds to let each screen settle

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/website/screenshots"
DERIVED="${DERIVED:-${TMPDIR:-/tmp}/icook4u-screenshots-dd}"

LANGS=("$@")
[[ ${#LANGS[@]} -eq 0 ]] && LANGS=(en bg de fr es it ru hi zh-Hans ja)

locale_for() {
  case "$1" in
    en) echo en_US ;; bg) echo bg_BG ;; de) echo de_DE ;; fr) echo fr_FR ;;
    es) echo es_ES ;; it) echo it_IT ;; ru) echo ru_RU ;; hi) echo hi_IN ;;
    zh-Hans) echo zh_CN ;; ja) echo ja_JP ;; *) echo en_US ;;
  esac
}

UDID="$(xcrun simctl list devices available -j | python3 -I -c '
import json, sys
name = sys.argv[1]
for runtime, devices in json.load(sys.stdin)["devices"].items():
    for d in devices:
        if d["name"] == name:
            print(d["udid"]); sys.exit()
' "$DEVICE_NAME")"
[[ -z "$UDID" ]] && { echo "No simulator named '$DEVICE_NAME'"; exit 1; }
echo "Simulator: $DEVICE_NAME ($UDID)"

echo "Building…"
xcodebuild -project "$ROOT/iCook.xcodeproj" -scheme iCook -configuration Debug \
  -destination "platform=iOS Simulator,id=$UDID" -derivedDataPath "$DERIVED" \
  build -quiet
APP="$DERIVED/Build/Products/Debug-iphonesimulator/iCook.app"

xcrun simctl boot "$UDID" 2>/dev/null || true
xcrun simctl bootstatus "$UDID" -b >/dev/null
xcrun simctl ui "$UDID" appearance light
xcrun simctl install "$UDID" "$APP"
xcrun simctl status_bar "$UDID" override --time "9:41" --batteryState charged --batteryLevel 100 \
  --cellularMode active --cellularBars 4 --wifiBars 3 --dataNetwork wifi

PANTRY="chicken_breast,eggs,egg_whites,spinach,cherry_tomatoes,feta,greek_yogurt,rolled_oats,bell_pepper,onion,garlic,broccoli,canned_tomatoes"

shoot() { # lang name args...
  local lang="$1" name="$2"; shift 2
  local locale; locale="$(locale_for "$lang")"
  xcrun simctl terminate "$UDID" "$BUNDLE_ID" 2>/dev/null || true
  xcrun simctl launch "$UDID" "$BUNDLE_ID" \
    -AppleLanguages "($lang)" -AppleLocale "$locale" -DebugLanguage "$lang" "$@" >/dev/null
  sleep "$WAIT"
  local png="$OUT/$lang/$name.png"
  xcrun simctl io "$UDID" screenshot --type=png "$png" >/dev/null 2>&1
  sips --resampleWidth "$WIDTH" -s format jpeg -s formatOptions 82 "$png" --out "$OUT/$lang/$name.jpg" >/dev/null
  rm -f "$png"
  echo "  $lang/$name.jpg"
}

for lang in "${LANGS[@]}"; do
  mkdir -p "$OUT/$lang"
  echo "$lang"
  shoot "$lang" home
  shoot "$lang" discover -DebugTab discover
  shoot "$lang" recipe   -DebugTab discover -DebugRoute recipe:protein_shakshuka
  shoot "$lang" nutrition -DebugTab discover -DebugRoute recipe:protein_shakshuka -DebugScroll nutrition
  shoot "$lang" kitchen  -DebugTab kitchen -DebugPantry "$PANTRY" -DebugRoute kitchenResults
  shoot "$lang" creami   -DebugTab discover -DebugRoute appliance:ninjaCreami
done

# Leave the simulator as we found it.
xcrun simctl launch "$UDID" "$BUNDLE_ID" -DebugLanguage system >/dev/null; sleep 2
xcrun simctl terminate "$UDID" "$BUNDLE_ID" 2>/dev/null || true
xcrun simctl status_bar "$UDID" clear
echo "Done → $OUT"
