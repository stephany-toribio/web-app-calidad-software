Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = "Stop"

$root = Split-Path $PSScriptRoot -Parent
$icons = Join-Path $root "public/icons"
New-Item -ItemType Directory -Force -Path $icons | Out-Null

function Draw-RoundedRect($g, $brush, $x, $y, $w, $h, $r) {
    $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
    try {
        $d = [single](2 * $r)
        $path.AddArc([single]$x, [single]$y, $d, $d, 180, 90)
        $path.AddArc([single]($x+$w-$d), [single]$y, $d, $d, 270, 90)
        $path.AddArc([single]($x+$w-$d), [single]($y+$h-$d), $d, $d, 0, 90)
        $path.AddArc([single]$x, [single]($y+$h-$d), $d, $d, 90, 90)
        $path.CloseFigure()
        $g.FillPath($brush, $path)
    }
    finally { $path.Dispose() }
}

function New-CreoIcon([int]$size, [bool]$maskable, [string]$name) {
    $bitmap = [System.Drawing.Bitmap]::new($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bitmap)
    $brush = [System.Drawing.SolidBrush]::new(
        [System.Drawing.ColorTranslator]::FromHtml("#F2B705")
    )
    try {
        $g.Clear([System.Drawing.Color]::White)
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

        $fraction = if ($maskable) { 0.56 } else { 0.70 }
        $scale = $size * $fraction / 20
        $cx = $size / 2
        $cy = $size / 2

        # Geometria del wordmark: rect(2,2,16,7) y rect(11,11,7,11).
        # Centrada segun sus limites reales: x=2..18, y=2..22.
        Draw-RoundedRect $g $brush `
            ($cx-8*$scale) ($cy-10*$scale) `
            (16*$scale) (7*$scale) (1.5*$scale)

        Draw-RoundedRect $g $brush `
            ($cx+1*$scale) ($cy-1*$scale) `
            (7*$scale) (11*$scale) (1.5*$scale)

        $bitmap.Save(
            (Join-Path $icons $name),
            [System.Drawing.Imaging.ImageFormat]::Png
        )
    }
    finally {
        $brush.Dispose()
        $g.Dispose()
        $bitmap.Dispose()
    }
}

foreach ($size in @(72,96,128,144,152,192,384,512)) {
    New-CreoIcon $size $false "icon-${size}x${size}.png"
}
foreach ($size in @(192,512)) {
    New-CreoIcon $size $true "icon-maskable-${size}x${size}.png"
}

Write-Output "Iconos Creo generados."
