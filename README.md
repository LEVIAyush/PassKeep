# PassKeep

A private password vault for the web, iOS and Android, built with Expo / React Native.
Everything is encrypted on your device with your master password. There is no server and no account.

## Features

- **Master password vault**: the whole vault is encrypted as one AES-256-GCM blob. The key comes from your master password via PBKDF2-SHA256 (600,000 rounds, random salt). No key is stored anywhere.
- **Auto-lock** after 1, 5, 15 or 30 minutes idle, when the app was in the background too long, and when another browser tab changes the vault.
- **Password generator** (secure randomness, 8-64 characters, character sets, skip look-alikes) and a **strength meter**.
- **Vault health**: flags weak, reused and old (6+ months) passwords on Home.
- **Copy to clipboard** for usernames and passwords; passwords are cleared from the clipboard after 30 seconds.
- **Favorites**, notes, search, Browser / App categories.
- **Encrypted backup**: download or copy a backup file, import it into an existing vault, or restore it on a fresh browser or device.
- **Change master password** and **erase vault**.
- **Migration**: passwords saved by PassKeep 1.x in the browser are moved into the new vault on first run.

## Deploy to Vercel

1. Push this project to your GitHub repository.
2. In Vercel choose **Add New > Project**, import the repo, and leave the settings alone. `vercel.json` already sets the build command (`npm run build`), output folder (`dist`) and security headers.
3. Deploy.

`npm run build` runs `expo export --platform web` and then `scripts/postbuild.js`, which:
- renames `dist/assets/node_modules` to `dist/assets/vendor` (Vercel drops folders named `node_modules`, which would break every icon),
- adds the web manifest, iOS icon and safe-area viewport tags,
- fails the build if the output contains anything the Content-Security-Policy would block.

## Develop

```bash
npm install
npm start          # then press w for web, or scan the QR code with Expo Go
npm test           # unit tests for the crypto, generator, strength and audit logic
npm run build      # production web build into ./dist
```

## How the security works

| Piece | Choice |
|---|---|
| Cipher | AES-256-GCM, fresh random 12-byte IV on every save; a wrong password or tampered data fails the auth tag |
| Key derivation | PBKDF2-SHA256, 600,000 iterations, random 16-byte salt per vault |
| Web | Web Crypto API; the derived key is non-extractable |
| iOS / Android | `@noble/hashes` + `@noble/ciphers` (same format, tested to interoperate with the web build) |
| At rest | One encrypted record: `{ v, kdf, iterations, salt, iv, data }`. Names, usernames and notes are inside the encrypted blob too |
| In memory | The key exists only while unlocked and is dropped on lock |
| Headers | Strict CSP (`script-src 'self'`), no framing, no referrer, locked-down permissions |

## Things to know

- **No recovery.** Forget the master password and the vault cannot be opened. Keep a backup.
- **The vault lives in one browser.** On the web it is stored in that browser's localStorage. Clearing site data deletes it, and other devices do not see it. Use *Download backup* to move it.
- Passwords in memory can't be perfectly protected from a compromised device or a malicious browser extension. This is a personal-use vault, not an audited product.
- PassKeep 1.x data on iOS/Android (SQLite) is not migrated automatically; only the web data is.
- Native builds were verified to bundle for Android and iOS, but were not run on a device or emulator.
