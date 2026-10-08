Add-Type -AssemblyName System.Drawing
Set-Location -LiteralPath $PSScriptRoot
$filePath = Join-Path $PSScriptRoot "Untitled.png"
Write-Host "Checking file: $filePath"
if (-not (Test-Path -LiteralPath $filePath)) {
    Write-Error "File not found!"
    exit 1
}
$bmp = [System.Drawing.Bitmap]::FromFile($filePath)
Write-Host "Loaded bitmap: $($bmp.Width) x $($bmp.Height)"
$newW = 2000
$newH = [int]($bmp.Height * 2000 / $bmp.Width)
$resized = New-Object System.Drawing.Bitmap $newW, $newH
$g = [System.Drawing.Graphics]::FromImage($resized)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($bmp, 0, 0, $newW, $newH)
$g.Dispose()
$bmp.Dispose()
$outPath = Join-Path $PSScriptRoot "canvas_overview.jpg"
$resized.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$resized.Dispose()
Write-Host "Saved canvas_overview.jpg ($newW x $newH)"
