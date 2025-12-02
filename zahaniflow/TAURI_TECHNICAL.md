# Tauri Integration — ZahaniFlow

This file documents how Tauri is used in the project, the problems we hit, and the workarounds we applied to get a stable native development flow on Linux (Ubuntu w/ snap-installed VS Code).

## Overview
- Frontend: `client/` (Vite dev server on `http://localhost:5173`)
- Tauri app: `zahaniflow/` with `src-tauri/` containing the Rust code and `tauri.conf.json`
- `tauri dev` uses `beforeDevCommand` to start the frontend and opens a native window pointed at the dev URL.

## Key files
- `zahaniflow/src-tauri/tauri.conf.json` — devUrl and beforeDevCommand set to the `client` server.
- `zahaniflow/package.json` — includes `tauri:dev`, `dev:live`, and `build:app` scripts.

## Runtime & Build Notes
- Use `npm run dev` (in `/client`) to run the web app.
- Use `npm run tauri:dev` (in `/zahaniflow`) to run the Tauri dev environment. On systems where VS Code is installed via snap, use the `dev:live` or `tauri:dev` script which unsets SNAP environment values and preloads the system `libc`.

Example:

```bash
# start frontend in one terminal
cd /path/to/ClinicFlow/client
npm run dev

# in another terminal (plain system terminal, not snap terminal)
cd /path/to/ClinicFlow/zahaniflow
env -u SNAP -u SNAP_NAME -u SNAP_DATA -u SNAP_COMMON -u SNAP_REVISION \
  LD_PRELOAD=/lib/x86_64-linux-gnu/libc.so.6 TAURI_DIR=./src-tauri npx tauri dev
```

## Bugs encountered & fixes

1. Cargo/Cargo.toml not found
- Symptom: `cargo metadata` failed when `TAURI_DIR` not set.
- Fix: Add `TAURI_DIR=./src-tauri` in scripts or pass via `env` when invoking `tauri`.

2. Missing pkg-config entries for `libsoup-3.0`
- Symptom: Build scripts couldn't find `libsoup-3.0` during compile.
- Fix: Manually created `/usr/lib/x86_64-linux-gnu/pkgconfig/libsoup-3.0.pc` with appropriate `Libs` and `Cflags` entries when `libsoup-3.0-dev` could not be installed due to apt conflicts.

3. Linker error `unable to find -lsoup-3.0`
- Symptom: Linker couldn't find `libsoup-3.0.so` (found `.so.0` only).
- Fix: `sudo ln -sf /usr/lib/x86_64-linux-gnu/libsoup-3.0.so.0 /usr/lib/x86_64-linux-gnu/libsoup-3.0.so`.

4. Snap glibc runtime conflict (critical)
- Symptom: After successful build, the binary failed at runtime with:
  `symbol lookup error: /snap/core20/current/lib/x86_64-linux-gnu/libpthread.so.0: undefined symbol: __libc_pthread_init, version GLIBC_PRIVATE`
- Root cause: Snap's `core20` ships its own glibc that was being injected into the runtime loader path when launching from a snap-launched terminal (VS Code snap).
- Workarounds applied:
  - Use `LD_PRELOAD=/lib/x86_64-linux-gnu/libc.so.6` when launching `tauri dev` to force preload of system glibc.
  - Unset common SNAP variables where possible: `env -u SNAP -u SNAP_NAME -u SNAP_DATA -u SNAP_COMMON -u SNAP_REVISION ...` when launching from scripts.
  - As a long-term solution: run the dev flow in a non-snap terminal or install non-snap VS Code.

5. Cargo runner / shell quoting complications
- Symptom: Attempts to set `runner` in `.cargo/config.toml` with complex quoting failed or produced TOML errors.
- Fix: Keep the build runner simple; prefer an executable wrapper script and avoid overly complex cargo `runner` quoting.

## Scripts provided
- `npm run dev` — runs the frontend (client).
- `npm run tauri:dev` — runs `tauri dev` with `LD_PRELOAD` and `TAURI_DIR` (recommended when running in a plain terminal).
- `npm run dev:live` — single-command live dev (uses `npx tauri dev` and unsets SNAP env vars).
- `npm run build:app` — produces production bundles via `npx tauri build`.

## Recommendations
- Use a non-snap terminal for native development (GNOME Terminal, Konsole, etc.).
- If you must use snap VS Code, add wrapper scripts or integrate the env unsets & LD_PRELOAD in the launch tasks.
- For CI and release builds, run `npx tauri build` on a clean environment (CI runner) rather than developer machines with snap-installed apps.

