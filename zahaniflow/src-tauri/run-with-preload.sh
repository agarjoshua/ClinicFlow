#!/bin/bash
# Wrapper to run the Tauri binary with proper glibc preload
# This receives the full binary path as first argument
export LD_PRELOAD=/lib/x86_64-linux-gnu/libc.so.6
exec "$1"
