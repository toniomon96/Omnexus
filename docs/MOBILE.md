# Omnexus — Mobile (iOS & Android) Guide

Omnexus uses **Capacitor v8** to package the existing Vite/React web app as a native iOS and Android application. The same codebase ships to web, App Store, and Play Store.

---

## How It Works

Capacitor wraps your built `dist/` folder in a native **WKWebView** (iOS) or **WebView** (Android). The app runs as a real native app — it has its own icon, splash screen, and access to native device APIs — but the UI is your existing React code.

```
Your React App (dist/)
        ↓
Capacitor Bridge
        ↓
iOS WKWebView  /  Android WebView
        ↓
Native OS (iOS / Android)
```

The Vercel serverless functions (`/api/*`) continue to run in the cloud. The native app fetches them over HTTPS using `VITE_API_BASE_URL`.

---

## Prerequisites

### For iOS (macOS only)

| Requirement | How to get it |
|---|---|
| macOS 13+ | Required — Xcode only runs on macOS |
| Xcode 15+ | Mac App Store — free |
| Xcode Command Line Tools | `xcode-select --install` |
| CocoaPods | `sudo gem install cocoapods` |
| Apple Developer account | [developer.apple.com](https://developer.apple.com) — free for Simulator, **$99/yr** for TestFlight + App Store |

### For Android (any OS)

| Requirement | How to get it |
|---|---|
| Android Studio (Hedgehog+) | [developer.android.com/studio](https://developer.android.com/studio) — free |
| Java 17 | Bundled with Android Studio, or `brew install openjdk@17` |
| Android SDK + AVD | Configured inside Android Studio (SDK Manager) |
| Google Play Console | [play.google.com/console](https://play.google.com/console) — **$25 one-time** |

---

## Environment Variables

Before building for native, add this to `.env.local`:

```bash
# Set to your deployed Vercel URL — required for native API calls
VITE_API_BASE_URL=https://your-app.vercel.app
```

**Why:** In the native WebView, relative fetch calls like `fetch('/api/ask')` resolve to the WebView's local origin, not Vercel. Setting `VITE_API_BASE_URL` makes them absolute so they reach your backend.

**On web:** Leave the variable empty (or omit it). Relative paths work fine via Vercel's routing.

---

## One-Time Setup

Run these once after cloning or after initial Capacitor installation:

```bash
# 1. Initialize Capacitor (reads capacitor.config.ts)
npx cap init

# 2. Add native platforms (creates ios/ and android/ directories)
npx cap add ios
npx cap add android

# 3. Build the web app and sync into native projects
npm run cap:sync
```

This creates:
- `ios/` — Xcode project (commit this to git)
- `android/` — Android Studio project (commit this to git)

---

## npm Scripts

| Script | What it does |
|---|---|
| `npm run cap:sync` | Build (`tsc + vite build`) then sync `dist/` into both platforms |
| `npm run cap:ios` | Build then sync iOS only |
| `npm run cap:android` | Build then sync Android only |
| `npm run cap:open:ios` | Open `ios/` in Xcode (no rebuild) |
| `npm run cap:open:android` | Open `android/` in Android Studio (no rebuild) |
| `npm run cap:run:ios` | Build, sync, and launch on iOS Simulator |
| `npm run cap:run:android` | Build, sync, and launch on Android emulator |

> **Important:** Always run `npm run cap:sync` (or the platform-specific variant) before opening Xcode or Android Studio after making code changes. The native projects serve the built `dist/` — they don't hot-reload.

---

## Daily Development Workflow

```bash
# 1. Make changes to your React code

# 2. Build and sync
npm run cap:sync

# 3. Open native IDE (only needed to run/debug on device/simulator)
npm run cap:open:ios        # macOS
npm run cap:open:android    # any OS

# 4. Press Run (▶) in the IDE
```

For web development, continue using `vercel dev` as normal — no Capacitor involvement needed.

---

## App Icon & Splash Screen

The current setup uses `favicon.svg` as a placeholder. Before submitting to stores you **must** provide PNG icons.

### Recommended approach — Capacitor Assets

```bash
npm install --save-dev @capacitor/assets

# Place a 1024×1024 PNG at:
#   resources/icon.png       (app icon)
#   resources/splash.png     (2732×2732 splash screen)

npx capacitor-assets generate
```

This auto-generates every required size for iOS and Android.

### iOS icon requirements
- 1024×1024 PNG (no alpha channel, no rounded corners — Apple rounds it)
- No transparency

### Android icon requirements
- Adaptive icon: foreground layer + background layer (or a single 1024×1024)
- Play Store listing: 512×512 PNG icon

---

## Running on a Real Device

### iOS (real iPhone)
1. Connect iPhone via USB and trust the computer
2. In Xcode: select your device from the device picker at the top
3. **Signing & Capabilities** → select your Apple Developer Team
4. Press ▶ — Xcode builds and installs on your device

> First time: go to iPhone Settings → General → VPN & Device Management → trust your developer certificate.

### Android (real Android device)
1. On the Android device: Settings → About Phone → tap "Build Number" 7 times to enable Developer Mode
2. Settings → Developer Options → enable USB Debugging
3. Connect via USB, accept the debugging prompt on the device
4. In Android Studio: select your device from the device picker and press ▶

---

## Building for Distribution

### iOS — TestFlight & App Store

```
npm run cap:sync   ← always do this first with VITE_API_BASE_URL set
npm run cap:open:ios
```

In Xcode:
1. Select **Any iOS Device (arm64)** as the target (not a simulator)
2. Set version number (e.g. `1.0.0`) and build number (e.g. `1`) in the target's **General** tab
3. **Product → Archive**
4. **Window → Organizer** → select the archive → **Distribute App**
5. Choose **App Store Connect** → upload

In [App Store Connect](https://appstoreconnect.apple.com):
1. Create a new app (Bundle ID: `com.omnexus.app`)
2. Fill in: name, subtitle, description, keywords, support URL, privacy policy URL
3. Upload screenshots (required sizes: 6.9" and 6.5" iPhone)
4. Submit for TestFlight beta testing first, then submit for App Store review

> App Store review typically takes **1–3 business days** for a new app.

### Android — Play Store

```
npm run cap:sync   ← always do this first with VITE_API_BASE_URL set
npm run cap:open:android
```

In Android Studio:
1. **Build → Generate Signed Bundle / APK**
2. Choose **Android App Bundle (.aab)** — Play Store requires this format
3. Create a new keystore (`.jks` file) — **back this up securely**, you need it for every future update
4. Choose release build variant → build
5. The `.aab` is output to `android/app/release/`

In [Google Play Console](https://play.google.com/console):
1. Create a new app
2. Go to **Production → Create new release** → upload the `.aab`
3. Fill in: title, short description, full description, screenshots, feature graphic (1024×500)
4. Set content rating (complete questionnaire)
5. Set privacy policy URL
6. Submit for review

> Play Store review typically takes **1–7 days** for a new app.

---

## Privacy Policy Requirement

Both stores **require** a privacy policy URL before submission. Since Omnexus collects:
- Email address (Supabase Auth)
- Workout data, body measurements, nutrition logs
- Push notification tokens

You need a privacy policy that covers data collection, storage, and deletion. The app already has a `/privacy` page — host it at a public URL (e.g. `https://your-app.vercel.app/privacy`) and use that URL in both store listings.

---

## Native Features Available

These are already implemented in `src/lib/capacitor.ts`:

| Feature | When it fires | API |
|---|---|---|
| **Haptic — light impact** | Every set marked complete | `triggerHaptic('light')` |
| **Haptic — success notification** | PR celebration | `triggerHapticNotification('success')` |
| **Status bar** | App launch | `initStatusBar()` — dark style, slate-950 bg |
| **Splash screen** | App launch | `hideSplashScreen()` — hides after first React paint |
| **Android back button** | Hardware back pressed | navigates back; minimises at root |
| **Safe areas** | Always | `pt-safe` on AppShell, `pb-safe` on BottomNav |

---

## Push Notifications — Phase 2

The current VAPID/web-push system works on web browsers only. Native push notifications require additional setup and are **not included in the current build**:

### What's needed
- **Android**: Firebase project + `google-services.json` + `@capacitor/push-notifications`
- **iOS**: APNs key in Apple Developer portal + Xcode Push Notifications capability
- **Backend**: `firebase-admin` npm package in a new Vercel function to send FCM messages
- **Database**: New `device_tokens` table (or column) in Supabase

### How the current code handles it
`src/lib/pushSubscription.ts` returns `'unsupported'` when `isNative` is true. The push notification toggle in ProfilePage is hidden on native. No crash, no broken UI.

---

## Key Files

| File | Purpose |
|---|---|
| `capacitor.config.ts` | App ID, webDir, plugin config (StatusBar, SplashScreen) |
| `src/lib/capacitor.ts` | Platform detection + all native plugin wrappers |
| `src/lib/api.ts` | `apiBase` — prefix for all `/api/*` fetch calls |
| `ios/` | Xcode project (generated by `npx cap add ios`) |
| `android/` | Android Studio project (generated by `npx cap add android`) |
| `public/manifest.json` | PWA manifest (also read by Capacitor) |

---

## Gotchas & Common Mistakes

**1. Forgot to sync before opening IDE**
Always run `npm run cap:sync` after code changes. The native projects serve a snapshot of `dist/` — they don't hot-reload. Running the old build in Xcode and wondering why changes aren't showing up is the #1 time waster.

**2. VITE_API_BASE_URL not set for native builds**
If the app loads but all AI features, articles, and profile actions fail silently, this is why. The fetch calls are hitting `capacitor://localhost/api/ask` instead of Vercel. Set the variable and rebuild.

**3. iOS status bar overlap**
`AppShell.tsx` has `pt-safe` on the outer div. If you add new full-screen pages that don't use AppShell, add `pt-safe` to their root element.

**4. Keystore loss = you can never update your Android app**
The Play Store ties app updates to the signing keystore. If you lose it, you must publish a brand-new app. Back it up to a password manager or secure cloud storage immediately.

**5. Capacitor plugins vs web APIs**
Some web APIs behave differently in WKWebView. Notably:
- `navigator.serviceWorker` exists but Web Push is unreliable → handled by returning `'unsupported'` on native
- `window.open()` may not work — use `@capacitor/browser` plugin instead
- File downloads need `@capacitor/filesystem` — the current GDPR export uses a blob URL which may not trigger a download prompt on native

**6. App Store screenshots**
Apple requires screenshots at specific sizes. Use a real device or Simulator, capture them, and upload. The most common required sizes are iPhone 6.9" (Pro Max) and 6.5".

**7. Android minSdkVersion**
Capacitor 6+ sets `minSdkVersion 23` (Android 6.0). This covers ~99% of active Android devices.

**8. iOS minimum deployment target**
Capacitor 6+ targets iOS 14+. This covers ~98% of active iPhones.

---

## Supabase Auth Deep Link (iOS & Android)

If you enable magic links or OAuth in Supabase Auth, you need to configure a deep link URL scheme so the app can handle the redirect back from email/OAuth:

In `capacitor.config.ts`:
```typescript
plugins: {
  // ...existing plugins...
  App: {
    appUrlOpenDelegate: true,
  },
},
```

In Supabase Dashboard → Auth → URL Configuration:
- Add `com.omnexus.app://` as a redirect URL

In `src/main.tsx`, add a listener for the `appUrlOpen` event and pass the URL to `supabase.auth.exchangeCodeForSession()`.

This is only needed if you add magic link or social OAuth login — email/password login (current implementation) works without deep links.

---

## Current Build Status

As of v1.0, the Capacitor native layer is **code-complete and committed**. Here is what has been done and what remains before App Store / Play Store submission:

| Area | Status |
|---|---|
| Capacitor v8 configured (`capacitor.config.ts`) | ✅ Done |
| iOS Xcode project generated (`ios/`) | ✅ Done |
| Android Studio project generated (`android/`) | ✅ Done |
| Haptics, status bar, splash screen, safe areas | ✅ Done |
| Android hardware back button | ✅ Done |
| `VITE_API_BASE_URL` env var documented | ✅ Done |
| Privacy policy page (`/privacy`) | ✅ Done |
| Exercise library (307 exercises) | ✅ Done |
| Learning, gamification, progressive overload, program continuation | ✅ Done |
| App icon (1024×1024 PNG) | ⚠️ Asset file needed in `resources/` |
| Splash screen (2732×2732 PNG) | ⚠️ Asset file needed in `resources/` |
| App icon injected into native projects | ⚠️ Run `npx capacitor-assets generate` after placing assets |
| iOS: Archive + TestFlight upload | ⬜ Requires macOS + Xcode |
| Android: Signed AAB + Play Store upload | ⬜ Requires Android Studio |
| Tested on real iOS device | ⬜ |
| Tested on real Android device | ⬜ |

**Shortest path to store submission:**
1. Place `resources/icon.png` (1024×1024) and `resources/splash.png` (2732×2732) in the repo
2. Run `npm install --save-dev @capacitor/assets && npx capacitor-assets generate`
3. Set `VITE_API_BASE_URL` in your build environment (`.env.local` for local builds)
4. Run `npm run cap:sync`
5. Open Xcode (`npm run cap:open:ios`) → Archive → TestFlight (requires Apple Developer Program)
6. Open Android Studio (`npm run cap:open:android`) → Build Signed Bundle → Play Console

---

## Checklist Before First Store Submission

- [x] `VITE_API_BASE_URL` set to production Vercel URL (`https://fitness-app-ten-eta.vercel.app`)
- [x] App icon: 1024×1024 PNG designed
- [x] Privacy policy hosted at `https://fitness-app-ten-eta.vercel.app/privacy`
- [x] Apple Developer Program enrolled
- [x] Google Play Console enrolled
- [x] `npx cap add ios && npx cap add android` run (platform directories generated and committed)
- [x] Capacitor native features wired: haptics, status bar, splash screen, safe areas, Android back button
- [ ] App icon placed in `resources/icon.png` and injected via `npx capacitor-assets generate`
- [ ] Splash screen: `resources/splash.png` (2732×2732 PNG) generated
- [ ] **Do NOT add HealthKit** — wearables deferred to v1.1
- [ ] iOS: `npm run cap:sync` → Xcode archive → TestFlight upload (requires Mac)
- [ ] Android: `npm run cap:sync` → signed AAB generated → Play Console upload
- [ ] App tested on a real iOS device (not just Simulator)
- [ ] App tested on a real Android device (not just emulator)
- [ ] All API features work (AI Q&A, insights, articles)
- [ ] Auth flow tested: sign up → log in → log out
- [ ] Stripe flow tested: upgrade → webhook fires → Premium badge shows
- [ ] Version number and build number set in Xcode / `build.gradle`
- [ ] iOS: signed with Distribution certificate (not Development)
- [ ] Android: signed with release keystore (not debug keystore)
- [ ] Android keystore (`omnexus.jks`) backed up securely
- [ ] App Store screenshots taken at required sizes (6.9" + 6.5" iPhone)
- [ ] Play Store feature graphic (1024×500) created
- [ ] Content rating questionnaire completed in Play Console
- [ ] Cron jobs verified working on production Vercel

> The build and submission steps above cover the full end-to-end process.
