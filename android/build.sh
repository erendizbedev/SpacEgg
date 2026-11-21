#!/bin/bash
# SpacEgg APK derleme: assets/ (index.html dahil) oldugu gibi paketlenir.
# Kullanim:
#   SG_KS_PASS='parola' ./build.sh      -> spacegg2.keystore ile GERCEK imza: out/SpacEgg-v<surum>.apk
#   ./build.sh                          -> parola yoksa gecici TEST anahtariyla: out/SpacEgg-v<surum>-TEST.apk
#                                          (kullanicinin telefonundaki surumun uzerine kurulmaz)
# Istege bagli: SG_KS_ALIAS (varsayilan spacegg), SG_KEY_PASS (varsayilan = SG_KS_PASS)
set -e
cd "$(dirname "$0")"
AJ=$(find /usr/lib/android-sdk -name android.jar | sort | head -1)
DX=/usr/lib/android-sdk/build-tools/debian/dx
[ -f assets/index.html ] || { echo "HATA: assets/index.html yok"; exit 1; }
VC=$(sed -n 's/.*android:versionCode="\([0-9]*\)".*/\1/p' AndroidManifest.xml | head -1)
VN=$(sed -n 's/.*android:versionName="\([^"]*\)".*/\1/p' AndroidManifest.xml | head -1)
rm -rf build out; mkdir -p build/gen build/cls out
aapt package -f -M AndroidManifest.xml -S res -A assets -I "$AJ" -m -J build/gen --min-sdk-version 24 --target-sdk-version 34 --version-code "$VC" --version-name "$VN" -F build/base.apk
javac --release 8 -encoding UTF-8 -nowarn -cp "$AJ" -d build/cls build/gen/com/spacegg/app/R.java src/com/spacegg/app/*.java 2>&1 | grep -v "^warning\|^Picked\|^Note" || true
"$DX" --dex --min-sdk-version=24 --output=build/classes.dex build/cls
(cd build && aapt add base.apk classes.dex >/dev/null)
zipalign -f -p 4 build/base.apk build/aligned.apk
if [ -n "$SG_KS_PASS" ]; then
  KS=${SG_KS_FILE:-spacegg2.keystore}; AL=${SG_KS_ALIAS:-spacegg}; KP=${SG_KEY_PASS:-$SG_KS_PASS}; SP=$SG_KS_PASS
  OUT=out/SpacEgg-v$VN.apk
else
  KS=build/test.keystore; AL=test; KP=testpass1; SP=testpass1
  keytool -genkeypair -keystore $KS -storepass $SP -keypass $KP -alias $AL -keyalg RSA -keysize 2048 -validity 100 -dname "CN=SpacEgg TEST" 2>&1 | grep -v Picked || true
  OUT=out/SpacEgg-v$VN-TEST.apk
  echo "UYARI: SG_KS_PASS yok, gecici TEST anahtari kullanildi."
fi
apksigner sign --ks $KS --ks-pass pass:$SP --ks-key-alias $AL --key-pass pass:$KP --v2-signing-enabled true --v3-signing-enabled true --out "$OUT" build/aligned.apk
apksigner verify --verbose "$OUT" 2>&1 | head -6
aapt dump badging "$OUT" | grep -E "^package|uses-permission|sdkVersion|targetSdk"
unzip -l "$OUT" | grep -E "assets/index.html|classes.dex"
ls -l "$OUT"
