#!/bin/bash
set -e
cd "$(dirname "$0")"
AJ=/usr/lib/android-sdk/platforms/android-23/android.jar
rm -rf classes out; mkdir -p classes out
aapt package -f -M AndroidManifest.xml -S res -A assets -I $AJ --min-sdk-version 24 --target-sdk-version 34 --version-code 9 --version-name 2.3.0 -F out/base.apk
javac --release 8 -cp $AJ -d classes src/com/spacegg/app/MainActivity.java 2>&1 | grep -v "^warning\|^Picked\|^Note" || true
dalvik-exchange --dex --min-sdk-version=24 --output=out/classes.dex classes
(cd out && aapt add base.apk classes.dex >/dev/null)
zipalign -f -p 4 out/base.apk out/aligned.apk
[ -f spacegg.keystore ] || keytool -genkeypair -keystore spacegg.keystore -storepass spacegg123 -keypass spacegg123 -alias spacegg -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=SpacEgg, O=SpacEgg, C=TR" 2>&1 | grep -v Picked
apksigner sign --ks spacegg.keystore --ks-pass pass:spacegg123 --key-pass pass:spacegg123 --out SpacEgg.apk out/aligned.apk
apksigner verify --verbose SpacEgg.apk 2>&1 | head -8
ls -l SpacEgg.apk
