git add .
git commit -m "feat: migrate workspace"
git branch -M main
git remote remove origin
git remote add origin https://github.com/dynamicmike-dashboard/realai-estateguard.git
git push -u origin main --force
Write-Host "Deployment script finished"
