# Lumina 代码上传脚本（Windows PowerShell）
# 用途：将本地代码上传到远程服务器
# 服务器 IP: 114.116.225.151
# 使用方法：在项目根目录执行 .\upload.ps1

param(
    [string]$ServerIP = "114.116.225.151",
    [string]$RemoteUser = "root",
    [string]$RemotePath = "/var/www/lumina"
)

Write-Host "=========================================="
Write-Host "  Lumina 代码上传脚本"
Write-Host "  服务器: $ServerIP"
Write-Host "=========================================="
Write-Host ""

# 检查是否在项目根目录
if (-not (Test-Path ".\backend") -or -not (Test-Path ".\frontend")) {
    Write-Host "❌ 错误：请在项目根目录执行此脚本"
    exit 1
}

# 检查是否安装了 SCP（通常通过 OpenSSH）
$scpPath = Get-Command scp -ErrorAction SilentlyContinue
if (-not $scpPath) {
    Write-Host "❌ 错误：未找到 scp 命令"
    Write-Host ""
    Write-Host "解决方案："
    Write-Host "1. 安装 OpenSSH：https://docs.microsoft.com/en-us/windows-server/administration/openssh/openssh_install_firstuse"
    Write-Host "2. 或在 Windows 设置中添加 OpenSSH"
    Write-Host ""
    Write-Host "已安装 OpenSSH 但仍出现此错误？"
    Write-Host "请在 PowerShell 中运行：Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0"
    exit 1
}

Write-Host "📦 准备上传代码..."
Write-Host "  源目录：$(Get-Location)"
Write-Host "  目标服务器：$RemoteUser@$ServerIP"
Write-Host "  目标路径：$RemotePath"
Write-Host ""

# 询问是否继续
$confirm = Read-Host "确认继续上传? (y/n)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "❌ 操作已取消"
    exit 0
}

Write-Host ""
Write-Host "🔄 开始上传..."
Write-Host ""

# 使用 SCP 上传整个项目目录
scp -r -P 22 `
    backend `
    frontend `
    COMPLETION_REPORT.md `
    DEPLOYMENT.md `
    DEPLOYMENT_CHECKLIST.md `
    STORAGE.md `
    deploy.sh `
    "$RemoteUser@$ServerIP`:$RemotePath"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=========================================="
    Write-Host "  ✅ 代码上传完成！"
    Write-Host "=========================================="
    Write-Host ""
    Write-Host "📝 后续步骤："
    Write-Host "1. 使用 SSH 连接到服务器："
    Write-Host "   ssh root@$ServerIP"
    Write-Host ""
    Write-Host "2. 进入项目目录："
    Write-Host "   cd $RemotePath"
    Write-Host ""
    Write-Host "3. 执行自动部署脚本："
    Write-Host "   bash ./deploy.sh"
    Write-Host ""
    Write-Host "4. 等待部署完成，然后访问网站："
    Write-Host "   http://$ServerIP"
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ 上传失败！"
    Write-Host ""
    Write-Host "常见问题排查："
    Write-Host "1. 检查服务器 IP 地址是否正确（当前：$ServerIP）"
    Write-Host "2. 检查是否能够 ping 通服务器："
    Write-Host "   ping $ServerIP"
    Write-Host "3. 检查 SSH 访问权限："
    Write-Host "   ssh root@$ServerIP"
    Write-Host "4. 如果使用 SSH 密钥，确保密钥已加载"
    Write-Host ""
    exit 1
}
