Add-Type -AssemblyName System.Drawing
$bmp = [System.Drawing.Bitmap]::FromFile("canvas_overview.jpg")
$h = $bmp.Height
$w = $bmp.Width
$rows = 9
$sliceH = [int]($h / $rows)
$cropDir = "canvas_crops"
if (-not (Test-Path $cropDir)) { New-Item -ItemType Directory -Path $cropDir | Out-Null }

for ($i = 0; $i -lt $rows; $i++) {
    $y = $i * $sliceH
    $currH = [Math]::Min($sliceH, $h - $y)
    $rect = New-Object System.Drawing.Rectangle 0, $y, $w, $currH
    $slice = $bmp.Clone($rect, $bmp.PixelFormat)
    $slicePath = Join-Path $cropDir ("row_{0:D2}.jpg" -f ($i + 1))
    $slice.Save($slicePath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
    $slice.Dispose()
    Write-Host "Saved row $($i + 1): y=$y to $($y + $currH)"
}
$bmp.Dispose()
Write-Host "All 9 rows saved."
