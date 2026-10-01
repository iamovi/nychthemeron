# Nychthemeron — Android TWA App Build & Configuration Guide

This file contains the configuration and step-by-step instructions for building and signing future versions of the **Nychthemeron** Trusted Web Activity (TWA) Android app.

---

## 📱 App Details & Metadata

| Property | Value |
|---|---|
| **App Name** | Nychthemeron |
| **Package ID** | `com.iamovi.genjutsu` |
| **PWA Web Manifest** | `https://nychthemeron.vercel.app/manifest.webmanifest` |
| **Host Domain** | `nychthemeron.vercel.app` |
| **Start URL** | `https://nychthemeron.vercel.app/` |
| **Theme Color** | `#9B78C2` |
| **Background Color** | `#1a0a2e` |
| **Current Version Name** | `3.0.0` |
| **Current Version Code** | `5` |

Updated date - october 1st 2026
---

## 🔑 Keystore & Signing Details

> **IMPORTANT**: Keep `signing.keystore` backed up in a secure location! Do NOT commit passwords to source control.

- **Keystore File Path**: `C:\Users\User\Desktop\workspace\signing.keystore`
- **Key Alias**: `my-key-alias`
- **Signer Name**: `genjutsu Admin`
- **Organization**: `genjutsu — everything vanishes`

---

## ⚙️ Environment Setup

- **JDK 17 Path**: `C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot`
- **Android SDK Path**: `C:\Users\User\.bubblewrap\android_sdk`
- **Bubblewrap Project Folder**: `C:\Users\User\Desktop\workspace\twa apk`

---

## 🚀 How to Build & Sign a New Version (Step-by-Step)

Follow these steps whenever you need to release a new version of the APK or Google Play Store AAB.

### Step 1: Open PowerShell and Navigate to the TWA Folder
```powershell
cd "C:\Users\User\Desktop\workspace\twa apk"
```

### Step 2: Set Environment Variables
```powershell
$env:JAVA_HOME="C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot"
$env:ANDROID_HOME="C:\Users\User\.bubblewrap\android_sdk"
$env:PATH="$env:JAVA_HOME\bin;$env:PATH"
```

### Step 3: Bump App Version (e.g., Version Code 6, Version Name 3.1.0)
Update both `twa-manifest.json` and `app/build.gradle` with your new version numbers:
- In `twa-manifest.json`:
  ```json
  "appVersionName": "3.1.0",
  "appVersionCode": 6,
  "appVersion": "3.1.0"
  ```
- In `app/build.gradle`:
  ```groovy
  versionCode 6
  versionName "3.1.0"
  ```

### Step 4: Compile the Release Binaries
Run Gradle to generate the unsigned APK and Play Store AAB:
```powershell
.\gradlew assembleRelease bundleRelease
```

### Step 5: Sign the APK
Replace `<YOUR_KEYSTORE_PASSWORD>` with your password when running:
```powershell
& "C:\Users\User\.bubblewrap\android_sdk\build-tools\34.0.0\apksigner.bat" sign --ks "C:\Users\User\Desktop\workspace\signing.keystore" --ks-pass pass:<YOUR_KEYSTORE_PASSWORD> --ks-key-alias my-key-alias --key-pass pass:<YOUR_KEYSTORE_PASSWORD> --out "app-release-signed.apk" "app\build\outputs\apk\release\app-release-unsigned.apk"
```

### Step 6: Sign the AAB (for Google Play Store)
Replace `<YOUR_KEYSTORE_PASSWORD>` with your password when running:
```powershell
& "C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot\bin\jarsigner.exe" -keystore "C:\Users\User\Desktop\workspace\signing.keystore" -storepass "<YOUR_KEYSTORE_PASSWORD>" -keypass "<YOUR_KEYSTORE_PASSWORD>" "app\build\outputs\bundle\release\app-release.aab" my-key-alias
```

---

## 📲 Installing & Testing

### Verify APK Signature
```powershell
& "C:\Users\User\.bubblewrap\android_sdk\build-tools\34.0.0\apksigner.bat" verify --verbose "app-release-signed.apk"
```

### Install directly to connected device
```powershell
adb install app-release-signed.apk
```
