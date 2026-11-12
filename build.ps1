# Builds lyrics.js from the lyrics\<category>\*.txt files.
# The real build is build.mjs (Node.js), which Vercel also runs on every deploy.
# Run:  powershell -ExecutionPolicy Bypass -File build.ps1      (or simply:  node build.mjs)
node (Join-Path $PSScriptRoot "build.mjs")
