# Tauri Dev Environment Setup - Linux

This document describes the fixes applied to get Tauri dev running on Linux with GTK/WebKit dependencies.

## Problem Summary

The initial `npm run tauri:dev` failed due to:
1. **Missing TAURI_DIR**: Tauri CLI couldn't find the Rust workspace in `src-tauri/`
2. **Missing system libraries**: `libsoup-3.0` and `javascriptcoregtk-4.1` were not in pkg-config
3. **Snap environment conflict**: VS Code snap's glibc was incompatible with the native Rust binary

## Solutions Applied

### 1. Configure npm scripts with TAURI_DIR
**File**: `package.json`

Added `TAURI_DIR=./src-tauri` to npm scripts so Tauri CLI knows where to find the Rust project.

```json
"tauri:dev": "LD_PRELOAD=/lib/x86_64-linux-gnu/libc.so.6 TAURI_DIR=./src-tauri tauri dev"
```

### 2. Create pkg-config file for libsoup-3.0
**File**: `/usr/lib/x86_64-linux-gnu/pkgconfig/libsoup-3.0.pc`

Created manual pkg-config file since `libsoup-3.0-dev` had version conflicts:

```ini
prefix=/usr
exec_prefix=${prefix}
libdir=${exec_prefix}/lib/x86_64-linux-gnu
includedir=${prefix}/include

Name: libsoup-3.0
Description: HTTP library implementation in C
Version: 3.6.0
Requires: glib-2.0 >= 2.67.0, gio-2.0
Libs: -L${libdir} -lsoup-3.0
Cflags: -I${includedir}/libsoup-3.0
```

### 3. Create symlink for libsoup-3.0.so
**Command**:
```bash
sudo ln -sf /usr/lib/x86_64-linux-gnu/libsoup-3.0.so.0 /usr/lib/x86_64-linux-gnu/libsoup-3.0.so
```

The linker was looking for `libsoup-3.0.so` but only `libsoup-3.0.so.0` and `libsoup-3.0.so.0.7.1` existed.

### 4. Work around snap glibc conflicts
**Solution**: Preload system glibc in npm scripts

The VS Code snap includes an old glibc that conflicts with the system's native glibc. Setting `LD_PRELOAD=/lib/x86_64-linux-gnu/libc.so.6` forces the system glibc to be used, allowing the Rust binary to run properly.

## Running Tauri Dev

```bash
cd /home/agar/projects/ClinicFlow/zahaniflow
npm run tauri:dev
```

This will:
1. Start the Vite dev server on `http://localhost:1420/`
2. Compile the Rust backend and launch the Tauri desktop app

## System Requirements

- **Rust toolchain** (stable): `cargo 1.91.1+`
- **Node.js**: 20.19+ or 22.12+ (currently 20.16.0, but functional)
- **System libraries**:
  - `libwebkit2gtk-4.1` and dev headers
  - `libsoup-3.0` and dev headers
  - `libjavascriptcoregtk-4.1` and dev headers
  - Build tools: `gcc`, `pkg-config`, `make`

## Testing the Build

The build should complete successfully and you'll see output like:
```
  ➜  Local:   http://localhost:1420/
  ✔ Tauri app is ready
```

If you see glibc errors, verify the `LD_PRELOAD` is set correctly in the npm scripts.

## Notes

- The Node.js version warning about Vite is non-critical; the app builds and runs fine
- This setup avoids Docker and keeps everything native on Linux for testing
- Future `npm run tauri:dev` runs should work without additional setup (the LD_PRELOAD is in package.json)
