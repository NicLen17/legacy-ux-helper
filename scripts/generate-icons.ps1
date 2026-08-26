$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$assets = Join-Path $root "assets"
$icons = Join-Path $root "icons"
$identifier = Join-Path $assets "app-identifier.jpg"
$toolbar = Join-Path $assets "toolbar-icon.jpg"

if (-not (Test-Path $identifier) -or -not (Test-Path $toolbar)) {
  throw "Missing source images in assets/ (app-identifier.jpg, toolbar-icon.jpg)."
}

New-Item -ItemType Directory -Force -Path $icons | Out-Null
Add-Type -AssemblyName System.Drawing

function Save-ResizedPng([string]$srcPath, [string]$destPath, [int]$size) {
  $src = [System.Drawing.Image]::FromFile($srcPath)
  try {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $bmp.SetResolution(96, 96)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    try {
      $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
      $g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
      $g.DrawImage($src, 0, 0, $size, $size)
    } finally {
      $g.Dispose()
    }
    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
  } finally {
    $src.Dispose()
  }
}

foreach ($size in 16, 32, 48, 128) {
  $appPath = Join-Path $icons "app-$size.png"
  $toolbarPath = Join-Path $icons "toolbar-$size.png"
  Save-ResizedPng $identifier $appPath $size
  Save-ResizedPng $toolbar $toolbarPath $size
  Write-Output "Created $appPath"
  Write-Output "Created $toolbarPath"
}
