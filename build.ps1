# Builds lyrics.js from the text files in the lyrics\ folder.
# File name (without .txt) must match the song title in songs.js.
# Run:  powershell -ExecutionPolicy Bypass -File build.ps1
$dir = Join-Path $PSScriptRoot "lyrics"
$map = [ordered]@{}
Get-ChildItem $dir -Filter *.txt | ForEach-Object {
  $text = [IO.File]::ReadAllText($_.FullName, [Text.Encoding]::UTF8)
  if ($text.Trim()) { $map[$_.BaseName] = $text }
}
$json = if ($map.Count) { $map | ConvertTo-Json -Depth 2 } else { "{}" }
$out = Join-Path $PSScriptRoot "lyrics.js"
[IO.File]::WriteAllText($out, "window.LYRICS = $json;`n", (New-Object Text.UTF8Encoding $false))

# Remove the old encrypted file if it is still there
$old = Join-Path $PSScriptRoot "lyrics.enc.js"
if (Test-Path $old) { Remove-Item $old -Confirm:$false }

Write-Host "lyrics.js built with $($map.Count) song(s)."
