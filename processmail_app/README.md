# ProcessMail Flutter App

This Flutter app now supports live server integration with the existing Node backend.

## Server Integration

The app reads runtime configuration from Dart defines:

- `PM_API_URL` (default: `http://localhost:3000/api`)
- `PM_EMAIL` (optional bootstrap login)
- `PM_PASSWORD` (optional bootstrap login)
- `PM_TOKEN` (optional bootstrap token)

If credentials/token are provided, the app logs in on splash and loads:

- `GET /email/accounts`
- `GET /emails`

## Run Example

```bash
flutter run \
  --dart-define=PM_API_URL=http://10.0.2.2:3000/api \
  --dart-define=PM_EMAIL=your@email.com \
  --dart-define=PM_PASSWORD=yourpassword
```

For Android emulator, use `10.0.2.2` instead of `localhost`.
