# Omnexus — Pending Tasks (v1.0 Launch)

> Last updated: March 2026
> All code is complete (0 TS errors · 29/29 tests passing). These are the remaining manual and platform steps needed before the app goes live.

---

## Status Legend

| Symbol | Meaning |
|---|---|
| ✅ | Done |
| ⏳ | Do on Windows (no Mac needed) |
| 🍎 | Requires macOS + Xcode |
| 📸 | Deferred — screenshots |

---

## Completed ✅

- All sprints (1–10) — code complete
- Apple Developer Program enrolled ($99/yr)
- Google Play Console enrolled ($25 one-time)
- Stripe account created, product + price created, webhook configured
- Stripe env vars added to Vercel + `.env.local`
- Supabase SQL migrations run (Sprint 6 + Sprint 10 tables)
- Supabase avatars storage bucket created + RLS policies applied
- App icon designed (1024×1024 PNG)
- Privacy policy page live at `/privacy`

---

## Step 1 — Add Native Platforms ⏳

Run these on your **Windows machine** once. They generate the `ios/` and `android/` project directories.

```powershell
npx cap add ios
npx cap add android
```

Then commit the generated folders:

```powershell
git add ios/ android/
git commit -m "feat: add Capacitor iOS and Android native platforms"
```

> These folders are large but must be committed — they contain the Xcode project and Android Studio project that are required for building.

---

## Step 2 — Android Build ⏳

Android Studio runs on Windows. Do this on your Windows machine.

```powershell
npm run build
npx cap sync android
npx cap open android
```

In Android Studio:
1. **Build → Generate Signed Bundle / APK → Android App Bundle**
2. Create keystore: File → `omnexus.jks`, Alias → `omnexus`
3. **⚠️ Back up `omnexus.jks` immediately** — losing it means you can never update the app on Play Store
4. Build Variant: `release`
5. Output: `android/app/release/app-release.aab`

Upload to Play Console:
1. [play.google.com/console](https://play.google.com/console) → Your app → Production → Create release
2. Upload `app-release.aab`
3. Privacy policy URL: `https://fitness-app-ten-eta.vercel.app/privacy`
4. Complete content rating questionnaire (Health & Fitness, no violence/sexual content)
5. Submit for review (typically 3–7 days)

---

## Step 3 — iOS Build 🍎

**Requires a Mac with Xcode installed.** Options if you don't have one:
- Borrow a Mac (library, Apple Store, friend)
- [MacStadium](https://www.macstadium.com) — cloud Mac rental
- [GitHub Actions macOS runner](https://docs.github.com/en/actions/using-github-hosted-runners) — free minutes for public repos, paid for private

On the Mac:

```bash
# Clone the repo (or copy from git)
git clone <your-repo-url>
cd fitness-app
npm install

# Build + sync iOS
npm run build
npx cap sync ios
npx cap open ios
```

In Xcode:
1. Bundle ID: `com.omnexus.app`
2. Version: `1.0.0` · Build: `1`
3. Deployment Target: iOS 16.0
4. Signing: select your Apple Developer Team → Automatic signing
5. **Capabilities: DO NOT add HealthKit** (wearables are deferred to v1.1)
6. Add Info.plist entry for push notifications (see `docs/STORE-SUBMISSION.md` section 3)
7. Target: **Any iOS Device (arm64)** — not a Simulator
8. **Product → Archive**
9. **Window → Organizer → Distribute App → App Store Connect → Upload**

In [App Store Connect](https://appstoreconnect.apple.com):
1. My Apps → + → New App → Bundle ID: `com.omnexus.app`
2. Fill metadata (see `docs/STORE-SUBMISSION.md` for copy-paste text)
3. Privacy policy URL: `https://fitness-app-ten-eta.vercel.app/privacy`
4. Select the uploaded build
5. App Review test account: your E2E test email/password
6. Submit for review (typically 24–48 hours)

---

## Step 4 — Screenshots 📸

**Both stores require screenshots before submission.** Deferred — do after native builds are working.

### iOS (from Simulator — macOS only)
Take screenshots with `⌘S` in Simulator at these sizes:
| Device | Size |
|---|---|
| iPhone 15 Pro Max | 1290 × 2796 px |
| iPhone 8 Plus | 1242 × 2208 px |

### Android (from Emulator — any OS)
Use Extended Controls → Screenshot in Android emulator:
| Device | Min size |
|---|---|
| Phone | 1080 × 1920 px |

### Recommended 5 screens (both platforms):
1. Dashboard — streak + muscle heat map
2. Active workout — set logging + PR banner
3. Ask Omnexus — AI answer with citations
4. Challenges page — team challenge card
5. Community feed with reactions

---

## Step 5 — Stripe Webhook Events

Verify the webhook endpoint has ALL three events registered:

**Stripe Dashboard → Developers → Webhooks → your endpoint → Edit → ensure these events are listed:**
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

---

## Step 6 — Add `APP_URL` Server-Side Env Var

`VITE_APP_URL` is not available in Vercel serverless functions (Vite inlines `VITE_` vars at build
time only). The Stripe redirect URLs were using localhost in production until this was fixed.

**Add to Vercel dashboard** (Settings → Environment Variables → Production):
```
APP_URL=https://fitness-app-ten-eta.vercel.app
```

This is separate from `VITE_API_BASE_URL` — both must be set.

---

## Post-Launch (after both apps are approved)

- [ ] Verify PostHog events flowing (workout_completed, ask_submitted, etc.)
- [ ] Monitor Xcode Organizer for iOS crash reports
- [ ] Monitor Play Console Android Vitals for Android crashes
- [ ] Update `MEMORY.md` with App Store app ID and Play Store package name
- [ ] Tag git with `v1.0.0`: `git tag v1.0.0 && git push --tags`

---

## Quick Reference — URLs

| Resource | URL |
|---|---|
| Live app | https://fitness-app-ten-eta.vercel.app |
| Privacy policy | https://fitness-app-ten-eta.vercel.app/privacy |
| Stripe dashboard | https://dashboard.stripe.com |
| Supabase dashboard | https://app.supabase.com |
| App Store Connect | https://appstoreconnect.apple.com |
| Google Play Console | https://play.google.com/console |
| Vercel dashboard | https://vercel.com/dashboard |
