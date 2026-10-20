# ADAM v2.1 – UI / Content Update

- Android status-bar-safe top bar: ADAM title and settings no longer sit under the status bar.
- Settings button has a larger touch target and accessibility role.
- Learn and Practice category selectors use a fixed compact height on narrow Android screens; no full-height stretched buttons.
- Word rows no longer contain nested touchables.
- Added A1: 500-word pool.
- Added B2: 500-word pool.
- Word filter now has real A1/A2/B1/B2 data in the app.
- Added 5 A1 stories and 5 B2 stories; the Stories tab now contains 5 stories per level (20 total).
- Story level selector shows the real number of stories.
- app.json cleaned of old Lingo Frekans EAS owner/projectId linkage.
- Android package changed to com.nayza06.adamvikingenglish.

## Build

```bash
npm install
npx expo-doctor
npx expo start --clear
```

For APK:

```bash
eas login
eas build:configure
eas build -p android --profile preview
```
