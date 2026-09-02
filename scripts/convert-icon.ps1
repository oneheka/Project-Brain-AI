Add-Type -AssemblyName System.Drawing
$sourcePath = "C:\Users\Rr984\.gemini\antigravity-ide\brain\182339a1-7371-4dd6-93ea-be50f3c1069c\projectbrain_marketplace_icon_1788352826204.jpg"
$destPath = "D:\ShareCode\Programming\Heka Solo Working\AI\projectbraind\apps\vscode\resources\icon.png"

$img = [System.Drawing.Image]::FromFile($sourcePath)
$bmp = New-Object System.Drawing.Bitmap 256, 256
$graphics = [System.Drawing.Graphics]::FromImage($bmp)
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$graphics.DrawImage($img, 0, 0, 256, 256)

$bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)

$graphics.Dispose()
$bmp.Dispose()
$img.Dispose()

Write-Host "✅ Created 256x256 PNG at $destPath"
