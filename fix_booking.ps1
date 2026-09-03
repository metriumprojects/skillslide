$file = 'src\controllers\bookingController.js'
$content = Get-Content $file -Raw

# Pattern to match the old duplicate message block
$pattern = '      // [^\n]*Initial welcome messages\s+await Message\.create\(\{\s+roomId: chatRoom\._id,\s+userId: teacher\._id,\s+message: `Hi \$\{[\s\S]*?\}\);\s+}'

# Replace with nothing (remove it)
$content = $content -replace $pattern, ''

# Write back to file
Set-Content $file $content -Encoding UTF8
Write-Host "Fixed duplicate message code"
