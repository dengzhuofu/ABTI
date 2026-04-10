Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"

$outDir = Join-Path $PSScriptRoot "..\assets\avatars"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function New-ColorFromHex {
  param(
    [string]$Hex,
    [int]$Alpha = 255
  )

  $value = $Hex.TrimStart("#")
  [System.Drawing.Color]::FromArgb(
    $Alpha,
    [Convert]::ToInt32($value.Substring(0, 2), 16),
    [Convert]::ToInt32($value.Substring(2, 2), 16),
    [Convert]::ToInt32($value.Substring(4, 2), 16)
  )
}

function Get-ShadedHex {
  param(
    [string]$Hex,
    [int]$Delta
  )

  $value = $Hex.TrimStart("#")
  $r = [Math]::Min([Math]::Max([Convert]::ToInt32($value.Substring(0, 2), 16) + $Delta, 0), 255)
  $g = [Math]::Min([Math]::Max([Convert]::ToInt32($value.Substring(2, 2), 16) + $Delta, 0), 255)
  $b = [Math]::Min([Math]::Max([Convert]::ToInt32($value.Substring(4, 2), 16) + $Delta, 0), 255)
  "#{0}{1}{2}" -f $r.ToString("x2"), $g.ToString("x2"), $b.ToString("x2")
}

function Pt {
  param([double]$X, [double]$Y)
  [System.Drawing.PointF]::new([single]$X, [single]$Y)
}

function Fill-PolygonShape {
  param(
    [System.Drawing.Graphics]$Graphics,
    [string]$Hex,
    [System.Drawing.PointF[]]$Points,
    [int]$Alpha = 255
  )

  $brush = [System.Drawing.SolidBrush]::new((New-ColorFromHex -Hex $Hex -Alpha $Alpha))
  $Graphics.FillPolygon($brush, $Points)
  $brush.Dispose()
}

function Fill-EllipseShape {
  param(
    [System.Drawing.Graphics]$Graphics,
    [string]$Hex,
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [int]$Alpha = 255
  )

  $brush = [System.Drawing.SolidBrush]::new((New-ColorFromHex -Hex $Hex -Alpha $Alpha))
  $Graphics.FillEllipse($brush, $X, $Y, $Width, $Height)
  $brush.Dispose()
}

function Fill-RoundedRect {
  param(
    [System.Drawing.Graphics]$Graphics,
    [string]$Hex,
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius,
    [int]$Alpha = 255
  )

  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $diameter = $Radius * 2
  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  $brush = [System.Drawing.SolidBrush]::new((New-ColorFromHex -Hex $Hex -Alpha $Alpha))
  $Graphics.FillPath($brush, $path)
  $brush.Dispose()
  $path.Dispose()
}

function Draw-Backdrop {
  param(
    [System.Drawing.Graphics]$Graphics,
    [hashtable]$Config
  )

  Fill-EllipseShape $Graphics $Config.scene 44 44 340 300 92
  Fill-EllipseShape $Graphics $Config.sceneAccent 248 28 122 112 116
  Fill-EllipseShape $Graphics "#ffffff" 70 66 292 250 54
  Fill-EllipseShape $Graphics "#ffffff" 106 312 210 28 24

  switch ($Config.sceneType) {
    "spotlight" {
      Fill-PolygonShape $Graphics "#fff7dd" @((Pt 168 60), (Pt 252 60), (Pt 316 258), (Pt 104 258)) 180
    }
    "waves" {
      Fill-PolygonShape $Graphics "#dff6f1" @((Pt 30 250), (Pt 120 228), (Pt 186 250), (Pt 256 228), (Pt 348 250), (Pt 348 308), (Pt 30 308))
      Fill-PolygonShape $Graphics "#bfeee3" @((Pt 30 280), (Pt 116 258), (Pt 188 280), (Pt 252 258), (Pt 348 278), (Pt 348 330), (Pt 30 330))
    }
    "desk" {
      Fill-PolygonShape $Graphics "#dcebf0" @((Pt 62 252), (Pt 340 252), (Pt 312 302), (Pt 86 302))
    }
    "mirror" {
      Fill-RoundedRect $Graphics "#ebf7f3" 46 78 112 182 26 210
      Fill-RoundedRect $Graphics "#dff1ea" 262 78 112 182 26 210
    }
    "coffin" {
      Fill-EllipseShape $Graphics $Config.sceneAccent 88 278 244 26 28
    }
    default {
      Fill-EllipseShape $Graphics "#dff4ec" 72 280 268 28 30
    }
  }
}

function Draw-EyeAndMouth {
  param(
    [System.Drawing.Graphics]$Graphics,
    [hashtable]$Config,
    [float]$OffsetX = 0,
    [float]$OffsetY = 0,
    [float]$Scale = 1.0
  )

  $ink = [System.Drawing.Pen]::new((New-ColorFromHex "#243a33"), 4 * $Scale)
  $ink.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $ink.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

  $leftEyeX = 172 + $OffsetX
  $rightEyeX = 214 + $OffsetX
  $eyeY = 122 + $OffsetY
  $mouthX = 180 + $OffsetX
  $mouthY = 150 + $OffsetY

  switch ($Config.mood) {
    "sad" {
      $Graphics.DrawLine($ink, $leftEyeX - 6, $eyeY + 2, $leftEyeX + 6, $eyeY + 2)
      $Graphics.DrawLine($ink, $rightEyeX - 6, $eyeY + 2, $rightEyeX + 6, $eyeY + 2)
      $Graphics.DrawArc($ink, $mouthX, $mouthY, 34, 16, 200, 140)
    }
    "angry" {
      $Graphics.DrawLine($ink, $leftEyeX - 8, $eyeY + 2, $leftEyeX + 8, $eyeY - 4)
      $Graphics.DrawLine($ink, $rightEyeX - 8, $eyeY - 4, $rightEyeX + 8, $eyeY + 2)
      $Graphics.DrawArc($ink, $mouthX, $mouthY - 2, 36, 14, 205, 120)
    }
    "sleepy" {
      $Graphics.DrawLine($ink, $leftEyeX - 6, $eyeY + 2, $leftEyeX + 6, $eyeY + 2)
      $Graphics.DrawLine($ink, $rightEyeX - 6, $eyeY + 2, $rightEyeX + 6, $eyeY + 2)
      $Graphics.DrawArc($ink, $mouthX + 2, $mouthY + 4, 26, 8, 0, 180)
    }
    "focus" {
      $Graphics.DrawEllipse($ink, $leftEyeX - 12, $eyeY - 6, 24, 16)
      $Graphics.DrawEllipse($ink, $rightEyeX - 12, $eyeY - 6, 24, 16)
      $Graphics.DrawLine($ink, $leftEyeX + 12, $eyeY + 2, $rightEyeX - 12, $eyeY + 2)
      $Graphics.DrawArc($ink, $mouthX + 2, $mouthY + 2, 30, 10, 10, 160)
    }
    "worry" {
      Fill-EllipseShape $Graphics "#243a33" ($leftEyeX - 4) ($eyeY - 2) 8 8
      Fill-EllipseShape $Graphics "#243a33" ($rightEyeX - 4) ($eyeY - 2) 8 8
      $Graphics.DrawArc($ink, $leftEyeX - 10, $eyeY - 16, 18, 10, 190, 150)
      $Graphics.DrawArc($ink, $rightEyeX - 10, $eyeY - 16, 18, 10, 200, 150)
      $Graphics.DrawArc($ink, $mouthX, $mouthY + 2, 34, 16, 200, 140)
    }
    default {
      Fill-EllipseShape $Graphics "#243a33" ($leftEyeX - 4) ($eyeY - 2) 8 8
      Fill-EllipseShape $Graphics "#243a33" ($rightEyeX - 4) ($eyeY - 2) 8 8
      if ($Config.mood -eq "grin") {
        $Graphics.DrawArc($ink, $mouthX - 4, $mouthY - 2, 40, 18, 10, 160)
        $thin = [System.Drawing.Pen]::new((New-ColorFromHex "#243a33"), 2)
        $Graphics.DrawLine($thin, $mouthX + 2, $mouthY + 10, $mouthX + 30, $mouthY + 10)
        $thin.Dispose()
      } else {
        $Graphics.DrawArc($ink, $mouthX + 2, $mouthY + 1, 28, 14, 15, 150)
      }
    }
  }

  $ink.Dispose()
}

function Draw-Character {
  param(
    [System.Drawing.Graphics]$Graphics,
    [hashtable]$Config
  )

  Fill-EllipseShape $Graphics "#7ba392" 118 330 184 28 44

  Fill-PolygonShape $Graphics (Get-ShadedHex $Config.outfit -22) @((Pt 166 254), (Pt 205 254), (Pt 195 344), (Pt 152 344))
  Fill-PolygonShape $Graphics (Get-ShadedHex $Config.outfit -12) @((Pt 214 254), (Pt 252 254), (Pt 260 344), (Pt 218 344))
  Fill-PolygonShape $Graphics (Get-ShadedHex $Config.outfit -34) @((Pt 146 340), (Pt 212 340), (Pt 196 372), (Pt 136 370))
  Fill-PolygonShape $Graphics (Get-ShadedHex $Config.outfit -34) @((Pt 216 340), (Pt 286 340), (Pt 274 372), (Pt 210 372))

  $leftArm = if ($Config.pose -eq "wide") {
    @((Pt 98 182), (Pt 132 176), (Pt 128 268), (Pt 88 274))
  } elseif ($Config.pose -eq "lean") {
    @((Pt 108 186), (Pt 134 174), (Pt 118 268), (Pt 82 278))
  } else {
    @((Pt 102 186), (Pt 132 180), (Pt 124 264), (Pt 88 270))
  }
  $rightArm = if ($Config.pose -eq "wide") {
    @((Pt 278 176), (Pt 314 184), (Pt 324 272), (Pt 286 266))
  } elseif ($Config.pose -eq "lean") {
    @((Pt 274 174), (Pt 304 188), (Pt 332 274), (Pt 294 266))
  } else {
    @((Pt 278 180), (Pt 310 186), (Pt 322 268), (Pt 288 264))
  }

  Fill-PolygonShape $Graphics (Get-ShadedHex $Config.outfit -6) $leftArm
  Fill-PolygonShape $Graphics (Get-ShadedHex $Config.outfit 4) $rightArm
  Fill-PolygonShape $Graphics $Config.skin @((Pt 78 266), (Pt 110 260), (Pt 124 286), (Pt 90 300), (Pt 62 282))
  Fill-PolygonShape $Graphics $Config.skin @((Pt 292 260), (Pt 326 268), (Pt 340 288), (Pt 308 300), (Pt 280 286))

  if ($Config.pose -eq "switch") {
    Fill-PolygonShape $Graphics $Config.outfit @((Pt 162 174), (Pt 212 172), (Pt 212 268), (Pt 154 268))
    Fill-PolygonShape $Graphics (Get-ShadedHex $Config.outfit -14) @((Pt 212 172), (Pt 266 178), (Pt 256 266), (Pt 212 268))
    Fill-PolygonShape $Graphics (Get-ShadedHex $Config.outfit 10) @((Pt 176 150), (Pt 282 154), (Pt 266 178), (Pt 162 174))
  } elseif ($Config.pose -eq "slouch") {
    Fill-PolygonShape $Graphics $Config.outfit @((Pt 166 174), (Pt 266 184), (Pt 252 266), (Pt 172 258))
    Fill-PolygonShape $Graphics (Get-ShadedHex $Config.outfit 10) @((Pt 188 150), (Pt 286 160), (Pt 266 184), (Pt 166 174))
    Fill-PolygonShape $Graphics (Get-ShadedHex $Config.outfit -16) @((Pt 266 184), (Pt 286 160), (Pt 276 248), (Pt 252 266))
  } else {
    Fill-PolygonShape $Graphics $Config.outfit @((Pt 162 176), (Pt 266 176), (Pt 256 268), (Pt 170 268))
    Fill-PolygonShape $Graphics (Get-ShadedHex $Config.outfit 10) @((Pt 178 154), (Pt 284 154), (Pt 266 176), (Pt 162 176))
    Fill-PolygonShape $Graphics (Get-ShadedHex $Config.outfit -16) @((Pt 266 176), (Pt 284 154), (Pt 276 248), (Pt 256 268))
  }

  Fill-PolygonShape $Graphics $Config.skin @((Pt 162 78), (Pt 252 78), (Pt 248 176), (Pt 166 176))
  Fill-PolygonShape $Graphics (Get-ShadedHex $Config.skin 16) @((Pt 182 44), (Pt 270 44), (Pt 252 78), (Pt 162 78))
  Fill-PolygonShape $Graphics (Get-ShadedHex $Config.skin -14) @((Pt 252 78), (Pt 270 44), (Pt 268 146), (Pt 248 176))

  if ($Config.sceneType -eq "mirror") {
    Fill-PolygonShape $Graphics (Get-ShadedHex $Config.skin -24) @((Pt 206 78), (Pt 252 78), (Pt 248 176), (Pt 206 176))
  }

  switch ($Config.hairStyle) {
    "wave" {
      Fill-PolygonShape $Graphics $Config.hair @((Pt 156 84), (Pt 182 40), (Pt 250 42), (Pt 274 88), (Pt 244 92), (Pt 210 64), (Pt 186 96))
    }
    "bang" {
      Fill-PolygonShape $Graphics $Config.hair @((Pt 158 80), (Pt 180 32), (Pt 258 40), (Pt 274 86), (Pt 242 82), (Pt 226 104), (Pt 188 90))
    }
    "flat" {
      Fill-PolygonShape $Graphics $Config.hair @((Pt 156 80), (Pt 178 50), (Pt 258 50), (Pt 270 88), (Pt 238 86), (Pt 212 98), (Pt 184 88))
    }
    "split" {
      Fill-PolygonShape $Graphics $Config.hair @((Pt 156 82), (Pt 188 40), (Pt 212 64), (Pt 212 82))
      Fill-PolygonShape $Graphics (Get-ShadedHex $Config.hair -14) @((Pt 212 82), (Pt 212 54), (Pt 268 42), (Pt 274 84))
    }
    default {
      Fill-PolygonShape $Graphics $Config.hair @((Pt 156 82), (Pt 182 40), (Pt 252 42), (Pt 272 86), (Pt 244 88), (Pt 210 60), (Pt 186 92))
    }
  }

  Draw-EyeAndMouth -Graphics $Graphics -Config $Config
}

function Draw-SceneProp {
  param(
    [System.Drawing.Graphics]$Graphics,
    [hashtable]$Config
  )

  switch ($Config.sceneType) {
    "stage" {
      Fill-PolygonShape $Graphics "#fff7e4" @((Pt 262 56), (Pt 286 84), (Pt 268 112), (Pt 246 84))
      Fill-PolygonShape $Graphics "#f6b87e" @((Pt 124 96), (Pt 144 88), (Pt 150 126), (Pt 132 132))
      Fill-PolygonShape $Graphics "#39484a" @((Pt 138 70), (Pt 144 88), (Pt 150 126), (Pt 142 136), (Pt 148 150), (Pt 142 154), (Pt 134 140), (Pt 128 142))
    }
    "spotlight" {
      Fill-EllipseShape $Graphics "#ffd891" 80 68 40 40 220
      Fill-EllipseShape $Graphics "#ffd891" 292 92 22 22 220
      Fill-PolygonShape $Graphics "#ffffff" @((Pt 82 70), (Pt 96 84), (Pt 82 98), (Pt 68 84)) 180
      Fill-PolygonShape $Graphics "#ffffff" @((Pt 314 88), (Pt 322 96), (Pt 314 104), (Pt 306 96)) 180
    }
    "judgment" {
      Fill-RoundedRect $Graphics "#dbe7e1" 84 242 84 28 12 255
      Fill-PolygonShape $Graphics "#c4d7cf" @((Pt 124 222), (Pt 154 242), (Pt 94 242))
      Fill-PolygonShape $Graphics "#8d9ea4" @((Pt 286 112), (Pt 318 124), (Pt 304 142), (Pt 272 130))
      Fill-PolygonShape $Graphics "#6e7e83" @((Pt 300 126), (Pt 334 138), (Pt 320 156), (Pt 286 144))
    }
    "romance" {
      Fill-PolygonShape $Graphics "#ffd6de" @((Pt 280 88), (Pt 296 74), (Pt 312 88), (Pt 304 110), (Pt 280 130), (Pt 256 110), (Pt 248 88), (Pt 264 74))
      Fill-RoundedRect $Graphics "#fff2f4" 84 250 68 46 14 255
      Fill-PolygonShape $Graphics "#f4c2cc" @((Pt 84 250), (Pt 118 228), (Pt 152 250), (Pt 118 274))
    }
    "burst" {
      Fill-PolygonShape $Graphics "#ffd1b7" @((Pt 288 52), (Pt 304 86), (Pt 336 96), (Pt 306 110), (Pt 294 146), (Pt 278 110), (Pt 246 96), (Pt 278 84))
    }
    "couch" {
      Fill-RoundedRect $Graphics "#d9e6cf" 72 248 98 44 18 255
      Fill-RoundedRect $Graphics "#bfd2b0" 94 224 74 28 14 255
      Fill-EllipseShape $Graphics "#dde7d6" 292 72 20 20 220
      Fill-EllipseShape $Graphics "#dde7d6" 314 56 28 28 220
    }
    "desk" {
      Fill-RoundedRect $Graphics "#ffffff" 258 210 72 46 12 250
      Fill-PolygonShape $Graphics "#d8edf4" @((Pt 262 214), (Pt 328 214), (Pt 328 248), (Pt 262 248))
      Fill-RoundedRect $Graphics "#f7fbfd" 94 212 58 36 10 250
    }
    "echo" {
      $font1 = [System.Drawing.Font]::new("Arial", 18, [System.Drawing.FontStyle]::Bold)
      $font2 = [System.Drawing.Font]::new("Arial", 12, [System.Drawing.FontStyle]::Bold)
      $brush1 = [System.Drawing.SolidBrush]::new((New-ColorFromHex "#5ea88d"))
      $brush2 = [System.Drawing.SolidBrush]::new((New-ColorFromHex "#86c8b2"))
      $Graphics.DrawString("ha", $font1, $brush1, 284, 68)
      $Graphics.DrawString("ha", $font2, $brush2, 308, 94)
      $brush1.Dispose(); $brush2.Dispose(); $font1.Dispose(); $font2.Dispose()
    }
    "mist" {
      Fill-EllipseShape $Graphics "#f3f7f6" 78 82 44 28 210
      Fill-EllipseShape $Graphics "#f3f7f6" 274 74 54 34 210
      Fill-EllipseShape $Graphics "#d8e3de" 290 238 32 20 220
    }
    "waves" {
      Fill-PolygonShape $Graphics "#ccefe7" @((Pt 252 238), (Pt 318 220), (Pt 336 244), (Pt 272 264))
      Fill-PolygonShape $Graphics "#b3e4d8" @((Pt 98 244), (Pt 158 228), (Pt 176 248), (Pt 112 266))
      Fill-RoundedRect $Graphics "#fffdf5" 274 110 36 58 10 245
    }
    "thought" {
      Fill-EllipseShape $Graphics "#dde4f5" 286 58 44 44 220
      Fill-EllipseShape $Graphics "#dde4f5" 266 102 18 18 220
      Fill-EllipseShape $Graphics "#dde4f5" 252 126 10 10 220
      Fill-RoundedRect $Graphics "#ffffff" 88 244 80 42 12 246
    }
    "mirror" {
      Fill-RoundedRect $Graphics "#ffffff" 280 82 80 174 20 220
      Fill-RoundedRect $Graphics "#eef7f3" 286 88 68 162 18 255
      Fill-PolygonShape $Graphics "#dbe7e3" @((Pt 90 248), (Pt 132 230), (Pt 150 248), (Pt 112 264))
    }
  }
}

function Draw-CoffinScene {
  param(
    [System.Drawing.Graphics]$Graphics,
    [hashtable]$Config
  )

  Fill-PolygonShape $Graphics "#1d1e22" @((Pt 36 200), (Pt 92 128), (Pt 338 112), (Pt 392 160), (Pt 370 304), (Pt 60 322), (Pt 20 276))
  Fill-PolygonShape $Graphics "#111216" @((Pt 56 208), (Pt 100 148), (Pt 330 134), (Pt 368 164), (Pt 352 286), (Pt 80 300), (Pt 40 268))
  Fill-PolygonShape $Graphics "#25272c" @((Pt 52 122), (Pt 92 74), (Pt 344 60), (Pt 390 108), (Pt 360 138), (Pt 328 118), (Pt 98 134))

  Fill-PolygonShape $Graphics $Config.skin @((Pt 118 154), (Pt 184 136), (Pt 210 192), (Pt 148 208), (Pt 96 180))
  Fill-PolygonShape $Graphics (Get-ShadedHex $Config.skin 16) @((Pt 130 120), (Pt 194 104), (Pt 184 136), (Pt 118 154))
  Fill-PolygonShape $Graphics (Get-ShadedHex $Config.skin -12) @((Pt 184 136), (Pt 194 104), (Pt 220 160), (Pt 210 192))
  Fill-PolygonShape $Graphics $Config.hair @((Pt 108 150), (Pt 122 112), (Pt 194 98), (Pt 220 156), (Pt 184 148), (Pt 154 126))

  $pen = [System.Drawing.Pen]::new((New-ColorFromHex "#243a33"), 4)
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $Graphics.DrawLine($pen, 140, 156, 150, 148)
  $Graphics.DrawLine($pen, 172, 148, 182, 156)
  $Graphics.DrawArc($pen, 146, 172, 34, 16, 10, 150)
  $pen.Dispose()

  Fill-PolygonShape $Graphics $Config.outfit @((Pt 152 194), (Pt 326 172), (Pt 330 244), (Pt 166 258))
  Fill-PolygonShape $Graphics (Get-ShadedHex $Config.outfit 12) @((Pt 180 176), (Pt 342 156), (Pt 326 172), (Pt 152 194))
  Fill-PolygonShape $Graphics (Get-ShadedHex $Config.outfit -18) @((Pt 326 172), (Pt 342 156), (Pt 350 230), (Pt 330 244))

  Fill-PolygonShape $Graphics "#f0f0f0" @((Pt 150 286), (Pt 286 278), (Pt 286 286), (Pt 150 294))
  Fill-PolygonShape $Graphics "#e2e2e2" @((Pt 170 278), (Pt 184 278), (Pt 184 304), (Pt 170 304))
  Fill-PolygonShape $Graphics "#e2e2e2" @((Pt 218 276), (Pt 232 276), (Pt 232 302), (Pt 218 302))
  Fill-PolygonShape $Graphics "#e2e2e2" @((Pt 264 274), (Pt 278 274), (Pt 278 300), (Pt 264 300))

  if ($Config.sceneType -eq "couch") {
    Fill-EllipseShape $Graphics "#dde6d5" 286 76 24 24 220
    Fill-EllipseShape $Graphics "#dde6d5" 310 60 34 34 220
  } else {
    Fill-EllipseShape $Graphics "#dde4f5" 280 74 24 24 220
    Fill-EllipseShape $Graphics "#dde4f5" 302 58 34 34 220
    Fill-EllipseShape $Graphics "#dde4f5" 326 76 24 24 220
  }
}

function Crop-And-RefitBitmap {
  param(
    [System.Drawing.Bitmap]$Bitmap
  )

  $minX = $Bitmap.Width
  $minY = $Bitmap.Height
  $maxX = -1
  $maxY = -1

  for ($x = 0; $x -lt $Bitmap.Width; $x++) {
    for ($y = 0; $y -lt $Bitmap.Height; $y++) {
      $pixel = $Bitmap.GetPixel($x, $y)
      if ($pixel.A -gt 8) {
        if ($x -lt $minX) { $minX = $x }
        if ($y -lt $minY) { $minY = $y }
        if ($x -gt $maxX) { $maxX = $x }
        if ($y -gt $maxY) { $maxY = $y }
      }
    }
  }

  if ($maxX -lt 0 -or $maxY -lt 0) {
    return $Bitmap
  }

  $cropWidth = $maxX - $minX + 1
  $cropHeight = $maxY - $minY + 1
  $target = [System.Drawing.Bitmap]::new(512, 512, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($target)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.Clear([System.Drawing.Color]::Transparent)

  $margin = 34
  $scale = [Math]::Min((512 - $margin * 2) / $cropWidth, (512 - $margin * 2) / $cropHeight)
  $drawWidth = [int]($cropWidth * $scale)
  $drawHeight = [int]($cropHeight * $scale)
  $drawX = [int]((512 - $drawWidth) / 2)
  $drawY = [int]((512 - $drawHeight) / 2)

  $srcRect = [System.Drawing.Rectangle]::new($minX, $minY, $cropWidth, $cropHeight)
  $destRect = [System.Drawing.Rectangle]::new($drawX, $drawY, $drawWidth, $drawHeight)
  $graphics.DrawImage($Bitmap, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
  $graphics.Dispose()
  $Bitmap.Dispose()
  return $target
}

$configs = @(
  @{ id = "jiahao"; outfit = "#6ab89e"; skin = "#f1d3bf"; hair = "#5b6664"; scene = "#d8efe6"; sceneAccent = "#ccebf6"; mood = "smirk"; pose = "wide"; hairStyle = "wave"; sceneType = "stage" },
  @{ id = "emo"; outfit = "#9ab4dd"; skin = "#ecd7cb"; hair = "#50586f"; scene = "#dde4f5"; sceneAccent = "#cfd7f2"; mood = "sad"; pose = "slouch"; hairStyle = "bang"; sceneType = "coffin" },
  @{ id = "clown"; outfit = "#efaa76"; skin = "#efd0b8"; hair = "#6b5158"; scene = "#ffe6d7"; sceneAccent = "#fff0bf"; mood = "grin"; pose = "wide"; hairStyle = "wave"; sceneType = "spotlight" },
  @{ id = "observer"; outfit = "#92b7a8"; skin = "#ead8ca"; hair = "#5b656b"; scene = "#dde9e4"; sceneAccent = "#d2def0"; mood = "focus"; pose = "still"; hairStyle = "flat"; sceneType = "judgment" },
  @{ id = "lickdog"; outfit = "#eea0ac"; skin = "#f2d6c5"; hair = "#775862"; scene = "#ffe4ea"; sceneAccent = "#ffd7df"; mood = "soft"; pose = "lean"; hairStyle = "wave"; sceneType = "romance" },
  @{ id = "explosive"; outfit = "#ea8d72"; skin = "#efcfb8"; hair = "#625755"; scene = "#ffdcd2"; sceneAccent = "#ffe9ca"; mood = "angry"; pose = "wide"; hairStyle = "wave"; sceneType = "burst" },
  @{ id = "bailan"; outfit = "#b8caa5"; skin = "#eadacb"; hair = "#70796c"; scene = "#e9f0e0"; sceneAccent = "#dbe6cf"; mood = "sleepy"; pose = "slouch"; hairStyle = "flat"; sceneType = "couch" },
  @{ id = "analyst"; outfit = "#7eb4cb"; skin = "#f1dbc7"; hair = "#55616a"; scene = "#d8edf4"; sceneAccent = "#ecf5fa"; mood = "focus"; pose = "still"; hairStyle = "flat"; sceneType = "desk" },
  @{ id = "repeater"; outfit = "#81c7b1"; skin = "#efd5be"; hair = "#55625b"; scene = "#dbf2ea"; sceneAccent = "#cde8de"; mood = "grin"; pose = "wide"; hairStyle = "wave"; sceneType = "echo" },
  @{ id = "airman"; outfit = "#d0d9d3"; skin = "#efddd1"; hair = "#828c87"; scene = "#eef4f2"; sceneAccent = "#dfe9e5"; mood = "sleepy"; pose = "still"; hairStyle = "flat"; sceneType = "mist" },
  @{ id = "trend"; outfit = "#71d1bf"; skin = "#f2d3be"; hair = "#586566"; scene = "#daf8f2"; sceneAccent = "#cceff5"; mood = "smirk"; pose = "wide"; hairStyle = "wave"; sceneType = "waves" },
  @{ id = "overthinker"; outfit = "#9eafdb"; skin = "#eddcd0"; hair = "#61667a"; scene = "#dfe5f5"; sceneAccent = "#ecf0fb"; mood = "worry"; pose = "lean"; hairStyle = "bang"; sceneType = "thought" },
  @{ id = "switcher"; outfit = "#93d1bf"; skin = "#efd3bf"; hair = "#5f6769"; scene = "#dcf5ee"; sceneAccent = "#d8eef5"; mood = "smirk"; pose = "switch"; hairStyle = "split"; sceneType = "mirror" }
)

foreach ($config in $configs) {
  $bmp = [System.Drawing.Bitmap]::new(512, 512, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bmp)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.Clear([System.Drawing.Color]::Transparent)

  Draw-Backdrop -Graphics $graphics -Config $config
  if ($config.sceneType -eq "coffin" -or $config.sceneType -eq "couch") {
    Draw-CoffinScene -Graphics $graphics -Config $config
  } else {
    Draw-SceneProp -Graphics $graphics -Config $config
    Draw-Character -Graphics $graphics -Config $config
  }

  $graphics.Dispose()
  $bmp = Crop-And-RefitBitmap -Bitmap $bmp
  $target = Join-Path $outDir "$($config.id).png"
  $bmp.Save($target, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}

Write-Output "generated $($configs.Count) png avatars"
