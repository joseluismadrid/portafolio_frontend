# Redimensiona los iconos de tecnologías y redes al doble de su tamaño de
# render en pantalla (48px -> 96px) conservando la transparencia y la
# proporción original. Se usa `System.Drawing`, disponible en Windows.
#
# Uso:  powershell -NoProfile -ExecutionPolicy Bypass -File tools/resize-icons.ps1
Add-Type -AssemblyName System.Drawing

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$maxSide = 96

$targets = @(
  'angular.png',
  'css.png',
  'docker.png',
  'github.png',
  'gmail.png',
  'html.png',
  'instagram.png',
  'ionic.png',
  'java.png',
  'javascript.png',
  'linkedin.png',
  'mongo.png',
  'mysql.png',
  'puntonet.png',
  'python.png',
  'react.png',
  'scss.png',
  'typescript.png',
  'whatsapp.png'
)

foreach ($name in $targets) {
  $path = (Resolve-Path (Join-Path $root "src/assets/icons/$name")).Path
  $original = [System.Drawing.Image]::FromFile($path)
  $before = (Get-Item -LiteralPath $path).Length
  $originalSize = "{0}x{1}" -f $original.Width, $original.Height

  $scale = [Math]::Min($maxSide / $original.Width, $maxSide / $original.Height)
  if ($scale -ge 1) {
    Write-Host ("YA PEQUEÑO  {0,-22} {1}" -f $name, $originalSize)
    $original.Dispose()
    continue
  }

  $width = [int][Math]::Round($original.Width * $scale)
  $height = [int][Math]::Round($original.Height * $scale)

  $bitmap = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.DrawImage($original, 0, 0, $width, $height)
  $graphics.Dispose()
  $original.Dispose()

  $temporary = "$path.tmp"
  $bitmap.Save($temporary, [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()

  Move-Item -LiteralPath $temporary -Destination $path -Force

  $after = (Get-Item -LiteralPath $path).Length
  Write-Host ("{0,-22} {1} -> {2}x{3}   {4,7:N1} kB -> {5,6:N1} kB" -f $name, $originalSize, $width, $height, ($before / 1KB), ($after / 1KB))
}
