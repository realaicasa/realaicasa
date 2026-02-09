git add .
git commit -m "feat: migrate workspace"
git branch -M main
git remote set-url origin https://github.com/realaicasa/realaicasa.git
git push origin main --force
Write-Host "Deployment script finished"
