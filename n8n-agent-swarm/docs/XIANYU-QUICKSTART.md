# 🚀 Xianyu Integration - Quick Start
# 闲鱼集成 - 快速入门

Get started with Xianyu auto-scraping in 5 minutes!
5分钟内开始使用闲鱼自动扫描！

---

## 💰 Zero-Cost Operation / 零成本运营

**NEW:** Remove GPT-4 Vision for $0 cost! See [XIANYU-ZERO-COST-GUIDE.md](./XIANYU-ZERO-COST-GUIDE.md)

**新功能：** 移除 GPT-4 Vision 实现零成本！查看 [零成本指南](./XIANYU-ZERO-COST-GUIDE.md)

| Mode | Cost per 1000 Products | Monthly (10 scans/day) |
|------|------------------------|------------------------|
| With GPT-4 Vision | ~$10 | ~$3,000 |
| **Without GPT-4 Vision** | **$0** | **$0** |

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

## 🎯 First Scan (3 Steps) / 首次扫描（3步）

### Step 1: Start Bot / 启动机器人

```bash
cd /home/user/workflows/n8n-agent-swarm
npm run manager
```

### Step 2: Login (One-Time) / 登录（一次性）

In Telegram / 在Telegram中:
```
/xianyu_login
```

**What happens / 发生什么:**
- Bot sends QR code / 机器人发送二维码
- Scan with Xianyu mobile app / 用闲鱼手机应用扫描
- Wait for confirmation (~30 seconds) / 等待确认（约30秒）

### Step 3: Scan Vendor / 扫描卖家

```
/xianyu_scan ABC123
```

Replace `ABC123` with real Xianyu vendor ID.
将 `ABC123` 替换为真实的闲鱼卖家ID。

**Example vendors to try / 可尝试的卖家示例:**
- Supreme resellers / Supreme转售商
- Nike/Adidas sellers / Nike/Adidas卖家
- Electronics vendors / 电子产品卖家

---

## 📊 Expected Results / 预期结果

After 10-15 minutes, you'll receive / 10-15分钟后，您将收到:

```
✅ 分析完成 / ANALYSIS COMPLETE

📦 已分析 / Analyzed: 847
🔍 找到价格 / Prices found: 156
🔥 有利可图 / Profitable: 18

📤 发送前 18 个交易... / Sending top 18 deals...
```

**Each deal includes / 每个交易包括:**
- 📦 Product title / 产品标题
- 💰 Price (China vs France) / 价格（中国 vs 法国）
- 📈 Profit calculation / 利润计算
- 💎 Recommendation / 推荐
- 📊 Vinted market data / Vinted市场数据
- 🖼️ Product photo / 产品照片
- 🔗 Direct link / 直接链接

**Sample deal output / 交易输出示例:**
```
🔥🔥 交易 #1 / DEAL #1

📦 Supreme Box Logo Hoodie

💰 中国价格 / China: ¥450 → €51.20
💵 Vinted均价 / Avg: €180.00
📈 利润 / PROFIT: €95.80 (53.2%)

💎 强烈推荐 / HIGHLY RECOMMENDED
📊 47 个Vinted类似商品 / similar listings

🔗 https://2.taobao.com/item.htm?id=...
```

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

## 🎉 Success Example / 成功示例

```
Input / 输入: /xianyu_scan VENDOR_123 30

Output / 输出:
- ✅ 543 products scanned / 已扫描产品
- 🔍 127 with Vinted prices / 有Vinted价格
- 🔥 15 profitable deals / 有利可图的交易
- 💰 Best profit / 最佳利润: €67.50
- ⏱️ Time / 时间: 8.2 minutes / 分钟
```

---

## 🌟 Key Features / 主要功能

✅ **Bilingual Output** / 双语输出
- All messages in Chinese and English
- 所有消息都是中英文

✅ **Zero Cost** / 零成本
- No GPT-4 Vision = $0 per scan
- 无GPT-4 Vision = 每次扫描 $0

✅ **Smart Matching** / 智能匹配
- 70+ Chinese term translations
- 70多个中文词汇翻译

✅ **Profit Focus** / 专注利润
- Clear profit calculations
- 清晰的利润计算

---

**Happy deal hunting! / 祝您淘到好货！🔥**
