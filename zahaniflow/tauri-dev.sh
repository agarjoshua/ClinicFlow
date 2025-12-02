#!/bin/bash
# Wrapper script to run Tauri with proper glibc preload
export LD_PRELOAD=/lib/x86_64-linux-gnu/libc.so.6
export TAURI_DIR=./src-tauri

## Navigate to the zahaniflow project directory and save it
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR/../client"
## Start the real frontend dev server (client/) in the background
## (Tauri will run the `beforeDevCommand` and start the client.)
cd "$ROOT_DIR/src-tauri"
# Run cargo (Tauri dev will call the `beforeDevCommand` configured in tauri.conf.json)
cargo run --no-default-features --color always

