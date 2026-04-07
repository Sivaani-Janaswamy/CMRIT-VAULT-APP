# CMRIT Vault Mobile

Flutter client for CMRIT Vault.

## Environment configuration

Release builds require runtime defines:

- `API_BASE_URL` (required in release, HTTPS only)
- `APP_ENV` (example: `staging`, `production`)
- `APP_VERSION` (example: `1.0.0+5`)
- `SENTRY_DSN` (optional but recommended)

## Local run

```bash
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000 --dart-define=APP_ENV=development
```

## Production build example

```bash
flutter build apk --release \
	--dart-define=API_BASE_URL=https://api.example.com \
	--dart-define=APP_ENV=production \
	--dart-define=APP_VERSION=1.0.0+1 \
	--dart-define=SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
```

## Quality gates

```bash
flutter analyze
flutter test
```
