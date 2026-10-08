# Cohort Live Student App

This is the Android student application for Cohort Live. Trainers use the separate Cohort Live Trainer web application.

## Important

- The Android app is student-only.
- New registrations create student profiles only.
- Existing trainer accounts are rejected by the Android app and must use the trainer website.
- The root route explicitly redirects to the student login or dashboard, preventing the default Expo starter screen from appearing.

## Run

1. Copy your existing `.env` into the project root.
2. Install dependencies with `npm.cmd install`.
3. Start Expo with `npm.cmd start -- --clear`.
