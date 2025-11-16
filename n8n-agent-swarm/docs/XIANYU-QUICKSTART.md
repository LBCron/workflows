# 🚀 Xianyu Integration - Quick Start

Get started with Xianyu auto-scraping in 5 minutes!

---

## ⚡ One-Command Setup

```bash
cd /home/user/workflows/n8n-agent-swarm
./scripts/setup-xianyu.sh
```

This will:
1. ✅ Check prerequisites (Python, Node.js, git)
2. ✅ Clone ai-goofish-monitor
3. ✅ Create Python virtual environment
4. ✅ Install all dependencies
5. ✅ Install Playwright browsers
6. ✅ Configure `.env` files
7. ✅ Run tests

---

## 📝 Manual Setup (Alternative)

### 1. Clone Scraper

```bash
cd /home/user/workflows
git clone https://github.com/Usagi-org/ai-goofish-monitor.git
```

### 2. Install Python Dependencies

```bash
cd ai-goofish-monitor
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
playwright install chromium
```

### 3. Configure Environment

```bash
# In ai-goofish-monitor/
nano .env
```

Add:
```
OPENAI_API_KEY="sk-proj-YOUR-KEY-HERE"
OPENAI_BASE_URL="https://api.openai.com/v1"
OPENAI_MODEL_NAME="gpt-4o"
```

### 4. Configure Manager Bot

```bash
# In n8n-agent-swarm/
nano .env
```

Add:
```
XIANYU_SCRAPER_PATH="/home/user/workflows/ai-goofish-monitor"
PYTHON_PATH="/home/user/workflows/ai-goofish-monitor/venv/bin/python"
```

---

## 🎯 First Scan (3 Steps)

### Step 1: Start Bot

```bash
cd /home/user/workflows/n8n-agent-swarm
npm run manager
```

### Step 2: Login (One-Time)

In Telegram:
```
/xianyu_login
```

- Bot sends QR code
- Scan with Xianyu mobile app
- Wait for confirmation (~30 seconds)

### Step 3: Scan Vendor

```
/xianyu_scan ABC123
```

Replace `ABC123` with real Xianyu vendor ID.

**Example vendors to try:**
- Supreme resellers
- Nike/Adidas sellers
- Electronics vendors

---

## 📊 Expected Results

After 10-15 minutes, you'll receive:

```
✅ ANALYSE TERMINÉE

⏱️ Produits analysés: 847
🔍 Prix Vinted trouvés: 156
🔥 Deals rentables: 18

📤 Envoi des top 18 deals...
```

Each deal includes:
- 📦 Product title
- 💰 Price (China vs France)
- 📈 Profit calculation
- 🤖 AI authenticity score
- 📊 Vinted market data
- 🖼️ Product photo
- 🔗 Direct link

---

## ⚙️ Configuration Options

### Scan Parameters

```bash
# Scan with default settings (50 pages max)
/xianyu_scan VENDOR_ID

# Limit to 20 pages (faster)
/xianyu_scan VENDOR_ID 20

# Scan more products (100 pages = ~2000 products)
/xianyu_scan VENDOR_ID 100
```

### Adjust Profit Threshold

Edit `src/integrations/vinted-api.js`:

```javascript
// Line 52: Change minimum profit
if (!vintedStats.found || profitCalc.profit < 20) {
  // Change 20 to your threshold (e.g., 30, 50, 100)
}
```

### Customize Analysis

Edit `src/integrations/xianyu-scraper.js`:

```javascript
getAnalysisPrompt() {
  return `Your custom prompt...`;
}
```

---

## 🐛 Common Issues & Fixes

### "Python not found"

```bash
# Check Python installation
python3 --version

# Update .env with full path
PYTHON_PATH="/usr/bin/python3"
```

### "Playwright not installed"

```bash
cd ai-goofish-monitor
source venv/bin/activate
playwright install chromium
```

### "QR code expired"

- Scan faster (within 2 minutes)
- Run `/xianyu_login` again

### "No profitable deals"

- Try different vendors
- Lower profit threshold in code
- Check Vinted availability for products

---

## 📚 Full Documentation

See [XIANYU-INTEGRATION.md](./XIANYU-INTEGRATION.md) for:
- Complete workflow explanation
- Architecture diagrams
- Advanced configuration
- Troubleshooting guide
- Performance metrics
- Security best practices

---

## 🔗 Useful Links

- **ai-goofish-monitor**: https://github.com/Usagi-org/ai-goofish-monitor
- **OpenAI API**: https://platform.openai.com/api-keys
- **Vinted France**: https://www.vinted.fr
- **Xianyu**: https://2.taobao.com

---

## ✅ Verification Checklist

Before your first scan:

- [ ] `./scripts/setup-xianyu.sh` completed successfully
- [ ] OpenAI API key configured
- [ ] `/xianyu_status` shows all ✅
- [ ] `/xianyu_login` completed
- [ ] Bot is running (`npm run manager`)

All checked? You're ready to scan! 🚀

---

## 💡 Pro Tips

1. **Start Small**: Test with 5-10 pages first
2. **Peak Hours**: Scan during Chinese business hours for more products
3. **Multiple Vendors**: Scan different vendors for variety
4. **Save Deals**: All deals auto-saved in `/deals` command
5. **Check Daily**: New products added daily on Xianyu

---

## 🎉 Success Example

```
Input: /xianyu_scan VENDOR_123 30

Output:
- ✅ 543 products scanned
- 🔍 127 with Vinted prices
- 🔥 15 profitable deals
- 💰 Best profit: €67.50
- ⏱️ Time: 8.2 minutes
```

**Happy deal hunting! 🔥**
