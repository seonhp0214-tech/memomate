# memomate 폴더를 http://localhost:5000 으로 보여 주는 간단한 서버 (확인용)
$root = $PSScriptRoot
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add("http://localhost:5000/")
$l.Prefixes.Add("http://127.0.0.1:5000/")
$l.Start()
$types = @{ ".html"="text/html; charset=utf-8"; ".css"="text/css; charset=utf-8"; ".js"="application/javascript; charset=utf-8" }
while ($l.IsListening) {
  $c = $l.GetContext()
  $p = $c.Request.Url.LocalPath.TrimStart("/")
  if ($p -eq "") { $p = "index.html" }
  $f = Join-Path $root $p
  if (Test-Path $f -PathType Leaf) {
    $b = [IO.File]::ReadAllBytes($f)
    $c.Response.ContentType = $types[[IO.Path]::GetExtension($f)]
    $c.Response.OutputStream.Write($b, 0, $b.Length)
  } else { $c.Response.StatusCode = 404 }
  $c.Response.Close()
}
