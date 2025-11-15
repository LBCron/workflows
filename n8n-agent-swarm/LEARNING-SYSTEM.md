# 🧠 Learning System Documentation

Complete guide to the self-improving AI system that makes n8n-agent-swarm smarter every day.

## 🎯 Overview

The Learning System is a **continuous improvement engine** that:

- ✅ Analyzes every interaction (success/failure, response time, user feedback)
- ✅ Identifies patterns and optimization opportunities
- ✅ A/B tests prompt improvements automatically
- ✅ Deploys validated optimizations
- ✅ Monitors performance continuously
- ✅ Self-corrects errors and prevents regression

**Goal**: Achieve and maintain 95%+ success rate with optimal performance and minimal cost.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Learning Loop                         │
└─────────────────────────────────────────────────────────┘

1. COLLECT DATA
   ↓
   Every interaction logged:
   - User input
   - Agent used
   - Response
   - Success/failure
   - Response time
   - Tokens used
   - User feedback (👍/👎)

2. ANALYZE PATTERNS
   ↓
   Daily analysis:
   - Success rates by agent
   - Common failure modes
   - Performance bottlenecks
   - Token usage trends
   - User satisfaction

3. GENERATE HYPOTHESES
   ↓
   Identify improvements:
   - "Email Agent fails on date parsing"
   - "Calendar Agent too verbose"
   - "Web Agent slow due to API latency"

4. CREATE VARIANTS
   ↓
   Generate optimizations:
   - Improved prompts
   - Better examples
   - Reduced token usage
   - Enhanced error handling

5. A/B TEST
   ↓
   Deploy to 10-20% traffic:
   - Measure performance
   - Compare to baseline
   - Statistical validation

6. DEPLOY WINNERS
   ↓
   Roll out improvements:
   - Update agent configs
   - Commit to GitHub
   - Deploy to production
   - Monitor impact

7. MONITOR & REPEAT
   ↓
   Continuous improvement:
   - Track metrics
   - Detect regressions
   - Rollback if needed
   - Start next cycle
```

---

## 📊 Metrics Tracked

### Success Metrics

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| Success Rate | 95%+ | < 90% |
| Avg Response Time | < 3s | > 10s |
| Token Usage | < 2000/interaction | > 3000 |
| User Satisfaction | 85%+ | < 70% |
| Error Rate | < 5% | > 10% |

### Per-Agent Metrics

- **Email Agent**: Success rate, search accuracy, send reliability
- **Calendar Agent**: Date parsing accuracy, timezone handling
- **Contact Agent**: Search precision, update success
- **YouTube Agent**: Search relevance, API efficiency
- **Web Agent**: Search quality, response time
- **Meta Agent**: Agent creation success, deployment reliability
- **Learning Agent**: Optimization impact, A/B test success

---

## 🚀 Usage

### Daily Analysis

```bash
# Analyze last 7 days
npm run learn

# Focus on specific agent
npm run learn -- --agent=email

# Custom period
npm run learn -- --period=30
```

**Output:**
- Overall performance summary
- Per-agent breakdown
- Error analysis
- Optimization recommendations

### Prompt Optimization

```bash
# Generate prompt variants
npm run optimize -- --agent=email --generate

# Run A/B test
npm run optimize -- --agent=email --test

# Deploy winning variant
npm run optimize -- --agent=email --deploy
```

**Workflow:**
1. Generate 3 variants (concise, examples, structured)
2. Test each variant with real traffic
3. Compare metrics to baseline
4. Deploy best performer

### Testing

```bash
# Run all tests
npm test

# Run specific suite
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:performance
```

**Tests validate:**
- Agent configurations
- Prompt effectiveness
- Tool availability
- Error handling
- Performance benchmarks

---

## 📈 Optimization Strategies

### 1. Prompt Engineering

**Concise Strategy:**
- Remove unnecessary verbosity
- Focus on core instructions
- **Impact**: -20% tokens, same accuracy

**Examples Strategy:**
- Add more usage examples
- Cover edge cases
- **Impact**: +5% success rate, +10% tokens

**Structured Strategy:**
- Better formatting
- Clear sections (Role, Capabilities, Instructions)
- **Impact**: +3% success rate, improved clarity

### 2. Error Pattern Analysis

**Common Patterns:**

```
Error: "Date parsing failed"
Solution: Add date format examples
Impact: -15% date-related errors

Error: "API timeout"
Solution: Implement caching + retry logic
Impact: -30% timeout errors

Error: "Unclear user intent"
Solution: Add clarifying questions to prompt
Impact: +10% accuracy
```

### 3. Performance Optimization

**Response Time:**
- Cache frequent API calls
- Optimize prompt length
- Parallel tool execution
- **Impact**: 2.8s → 2.1s avg response time

**Token Cost:**
- Remove redundant instructions
- Compress examples
- Use shorter system messages
- **Impact**: 1800 → 1400 tokens/interaction

---

## 🧪 A/B Testing Framework

### Test Setup

```javascript
// 1. Generate variants
const variants = generatePromptVariants('email', 3);

// 2. Deploy to subset
deployVariant('email_concise', {
  traffic: 20%, // 20% of users
  duration: '3 days'
});

// 3. Collect metrics
collectMetrics({
  baseline: 'email_current',
  variant: 'email_concise',
  metrics: ['success_rate', 'response_time', 'tokens']
});

// 4. Statistical analysis
const results = runStatisticalTest({
  confidence: 0.95,
  minimumSampleSize: 100
});

// 5. Deploy or rollback
if (results.significant && results.improvement > 5%) {
  deployToProduction('email_concise');
} else {
  rollback('email_concise');
}
```

### Success Criteria

A variant is deployed if:
- ✅ Statistically significant (p-value < 0.05)
- ✅ Improvement > 5% on key metric
- ✅ No regression on other metrics
- ✅ Minimum 100 samples collected

---

## 🤖 Automated Workflows

### Daily Optimization (GitHub Actions)

**Schedule**: Every day at 2 AM UTC

**Process:**
1. Pull last 24h of interaction data
2. Run learning system analysis
3. Identify agents with < 95% success rate
4. Generate and test prompt variants
5. Create PR if improvements found
6. Send Telegram notification with results

**Configuration**: `.github/workflows/daily-optimization.yml`

### Continuous Testing (GitHub Actions)

**Trigger**: Every commit, every PR

**Tests:**
- Unit tests (agent configurations)
- Integration tests (multi-agent coordination)
- E2E tests (complete user scenarios)
- Performance tests (response time, token usage)

**Report**: HTML report + Telegram notification

**Configuration**: `.github/workflows/continuous-testing.yml`

---

## 📊 Analytics Dashboard

```bash
# View real-time analytics
npm run analyze
```

**Displays:**
- Success rate trends (7d, 30d)
- Response time distribution
- Token usage breakdown
- Error rate by type
- User satisfaction score
- Cost analysis

**Export**:
- JSON data for further analysis
- CSV for spreadsheet import
- HTML report for sharing

---

## 🔔 Alerts & Monitoring

### Alert Conditions

| Condition | Severity | Action |
|-----------|----------|--------|
| Success rate < 90% | 🔴 Critical | Immediate investigation |
| Response time > 10s | 🟡 Warning | Check API latency |
| Error rate > 10% | 🔴 Critical | Review error logs |
| Token usage > budget | 🟡 Warning | Optimize prompts |
| No data for 24h | 🟡 Warning | Check logging |

### Notification Channels

- **Telegram**: Real-time alerts + daily reports
- **GitHub Issues**: Auto-create for critical errors
- **Email**: Weekly summary (configure in `.env`)

---

## 📚 Best Practices

### 1. Data Collection

**Required:**
- Log every interaction to Google Sheets
- Include all fields: input, agent, response, success, time, tokens
- Capture user reactions (👍/👎)

**Setup:**
```javascript
// In n8n workflow, add Google Sheets node
{
  "timestamp": "{{ $now }}",
  "user_input": "{{ $json.message }}",
  "agent_used": "email",
  "response": "{{ $json.response }}",
  "success": true,
  "response_time_ms": 2500,
  "tokens_used": 1200,
  "user_reaction": "👍"
}
```

### 2. Prompt Optimization

**Do:**
- ✅ Test variants with A/B testing
- ✅ Measure impact with real data
- ✅ Document changes in CHANGELOG
- ✅ Keep backup of original prompts

**Don't:**
- ❌ Deploy untested changes to production
- ❌ Optimize without baseline metrics
- ❌ Change multiple agents simultaneously
- ❌ Ignore user feedback

### 3. Testing Strategy

**Test Pyramid:**
```
        /\
       /E2E\      ← Few, slow, comprehensive
      /━━━━━\
     /Integr\     ← Some, medium, multi-component
    /━━━━━━━━\
   /   Unit   \   ← Many, fast, focused
  /━━━━━━━━━━━\
```

**Frequency:**
- Unit: Every commit
- Integration: Every PR
- E2E: Daily + before deploy
- Performance: Weekly

### 4. Rollback Strategy

**Always:**
- Create backups before changes
- Monitor metrics after deployment
- Have rollback plan ready

**Rollback if:**
- Success rate drops > 2%
- Error rate increases > 3%
- User complaints increase
- Performance degrades

**How to rollback:**
```bash
# Restore backup
cp agent-configs/email-agent.backup.md agent-configs/email-agent.md

# Commit and deploy
git add agent-configs/email-agent.md
git commit -m "Rollback: Restore email agent to previous version"
git push
fly deploy
```

---

## 🔧 Troubleshooting

### "No logs found"

**Problem**: Learning system can't find interaction data

**Solution**:
1. Check Google Sheets logging is configured
2. Verify `.env` has `GOOGLE_SHEET_ID`
3. Ensure n8n workflow is logging data
4. Check file exists: `logs/interactions.json`

### "Not enough data for analysis"

**Problem**: < 100 interactions

**Solution**:
- Wait for more usage (recommended)
- Lower `MIN_SAMPLES` in config (risky)
- Use demo data for testing

### "A/B test not significant"

**Problem**: p-value > 0.05

**Solution**:
- Extend test duration (collect more samples)
- Try different optimization strategy
- Ensure variant is meaningfully different

### "Tests failing after optimization"

**Problem**: Prompt changes broke tests

**Solution**:
1. Review test assertions
2. Update tests if prompts intentionally changed
3. Rollback if prompts have actual bugs
4. Run `npm test` before committing

---

## 📖 File Reference

### Core Scripts

| File | Purpose | Usage |
|------|---------|-------|
| `scripts/learning-system.js` | Main analysis engine | `npm run learn` |
| `scripts/optimize-prompts.js` | Prompt optimization | `npm run optimize` |
| `scripts/run-all-tests.js` | Master test runner | `npm test` |
| `scripts/analytics-dashboard.js` | Metrics visualization | `npm run analyze` |

### Agent Configurations

| File | Agent | Purpose |
|------|-------|---------|
| `agent-configs/learning-agent.md` | Learning | System optimization |
| `agent-configs/email-agent.md` | Email | Gmail operations |
| `agent-configs/calendar-agent.md` | Calendar | Event management |
| (others) | Various | Specialized tasks |

### Tests

| Directory | Type | Files |
|-----------|------|-------|
| `tests/unit/` | Unit | `test-*-agent.js` |
| `tests/integration/` | Integration | `test-multi-agent.js`, etc. |
| `tests/e2e/` | E2E | `test-*-scenario.js` |
| `tests/performance/` | Performance | `test-response-time.js`, etc. |

### Workflows

| File | Trigger | Purpose |
|------|---------|---------|
| `.github/workflows/continuous-testing.yml` | Every commit | Run all tests |
| `.github/workflows/daily-optimization.yml` | Daily 2 AM | Auto-optimize |

---

## 🎯 Success Metrics

### Short Term (1 week)

- ✅ All tests passing
- ✅ Logging configured
- ✅ First optimization deployed
- ✅ Baseline metrics established

### Medium Term (1 month)

- ✅ Success rate > 93%
- ✅ 3+ optimizations deployed
- ✅ Response time < 3.5s
- ✅ Cost reduced by 10%

### Long Term (3 months)

- ✅ Success rate > 95%
- ✅ Fully automated optimization
- ✅ Response time < 2.5s
- ✅ Cost reduced by 25%
- ✅ Zero critical bugs

---

## 🚀 Next Steps

1. **Set up logging**: Configure Google Sheets in n8n workflow
2. **Run baseline**: `npm run learn` to establish current performance
3. **Enable automation**: Ensure GitHub Actions workflows are active
4. **Monitor daily**: Check Telegram notifications
5. **Review weekly**: Analyze trends and optimization impact
6. **Iterate continuously**: The system improves itself!

---

**Remember**: The Learning System makes your AI smarter every day. Trust the data, test rigorously, and let the system evolve! 🧠📈

**Questions?** Check the code comments or run `npm run learn --help`
