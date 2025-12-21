# How to Push to GitHub - Manual Step by Step

## Your Repository Status

✅ Git is initialized and all files are committed  
✅ Your GitHub repo has been created at: https://github.com/mygithub011/smart-trade-backend  
⏳ Now we need to push the code

## Two Methods to Push

### Method 1: Using GitHub CLI (Easiest)

1. **Install GitHub CLI** from: https://cli.github.com/

2. **Open PowerShell in your backend folder and run:**
```powershell
gh auth login
```
Follow the prompts:
- Select "GitHub.com"
- Select "HTTPS" for protocol
- Select "Y" to authenticate with your GitHub credentials
- Your browser will open - login and authorize

3. **Then push:**
```powershell
git push -u origin main
```

---

### Method 2: Using Personal Access Token (PAT)

1. **Create a Personal Access Token on GitHub:**
   - Go to: https://github.com/settings/tokens/new
   - Give it a name (e.g., "Smart Trade Deploy")
   - Select scopes: ✓ repo (all options under repo)
   - Click "Generate token"
   - **Copy the token** (you won't see it again!)

2. **In PowerShell, run:**
```powershell
git remote set-url origin https://mygithub011:<YOUR_TOKEN>@github.com/mygithub011/smart-trade-backend.git

git push -u origin main
```

Replace `<YOUR_TOKEN>` with the token you copied.

**Note:** Your token will be saved in git credentials manager after first use.

---

### Method 3: HTTPS with Credential Manager (Windows)

1. **When git prompts for password, use this format:**
   - Username: `mygithub011`
   - Password: [Use your GitHub Personal Access Token, not your password]

2. **Run:**
```powershell
git push -u origin main
```

Windows Credential Manager will save it after first use.

---

## Verify It Worked

After pushing, verify here:
```powershell
git log --oneline -5

git remote -v
```

Visit your repo: https://github.com/mygithub011/smart-trade-backend

You should see all your files and folders listed! 🎉

---

## Common Issues

**"Repository not found"**
- Check the repo name matches exactly
- Verify you're logged in to the correct GitHub account
- Make sure the repo exists on GitHub

**"Permission denied"**
- Your token may be expired
- Create a new Personal Access Token
- Or use GitHub CLI for easier authentication

**"fatal: User canceled device code authentication"**
- You cancelled the browser login
- Try again and complete the GitHub login in your browser
