# CohortLive student app

*Learn live. Test real.*: the Android app for CohortLive students. It covers live classes (LiveKit) with live quizzes, assignments, courses and progress, and a **Mock Tests** tab for the proctored GATE mocks. The mocks themselves are taken on a laptop, in the web portal.

React Native + Expo SDK 54 + TypeScript (expo-router). Firebase Auth + Firestore are shared with the web portal (https://cohortlive-portal.netlify.app).

## Important

- Student accounts only. Trainers and admins use the web portal.
- **Live classes:** LiveKit access tokens come from the portal's `/api/livekit-token` function. It checks the Firebase ID token and admits students only to a class that is live. The LiveKit development sandbox is no longer used, from version 1.2.1.
- **Mock Tests:** lists the exams for the student's department, with status and times. *Take this on a laptop* opens the exam in the browser. Published results show marks and rank, and the scorecard PDF opens through the portal. There is no proctoring inside the app.

## Setup

```powershell
npm install
copy .env.example .env     # the six EXPO_PUBLIC_FIREBASE_* values (same Firebase project as the portal)
npx expo start --clear
```

| Variable | What |
|---|---|
| `EXPO_PUBLIC_FIREBASE_*` (6) | Firebase web config (not secret) |
| `EXPO_PUBLIC_PORTAL_URL` | web portal base URL (default `https://cohortlive-portal.netlify.app`); used for mock tests, scorecards and LiveKit tokens |

The EAS build profiles in `eas.json` already set these for `preview` and `production`.

## Build and release an APK

Needs the Expo account that owns the project (`asmitapaygude`).

1. Bump `expo.version` and `expo.android.versionCode` in `app.json`, and the version in `package.json`. Commit and push.
2. Run `npx eas build -p android --profile preview` (add `--non-interactive` once you are logged in). The APK link appears at the end, and on expo.dev.
3. GitHub → *Releases* → *Draft a new release*. Tag it `v<version>` and attach the APK. The promo site's **Download App** button points to `releases/latest`.

Icons and splash are generated from the brand kit (`npm run brand` in `cohort-live-trainer-web`). `/brand` holds the SVG and PNG masters.

## Versions
- **1.2.1** (versionCode 4): live classes use the portal's token function instead of LiveKit's development sandbox.
- **1.2.0** (versionCode 3): new CohortLive icon, splash and login logo with the tagline.
- **1.1.0** (versionCode 2): Mock Tests tab. This version was never released on its own.
- **1.0.0**: first release.
