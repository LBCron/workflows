# Unit Tests

Tests for individual agent configurations.

## What to Test

- ✅ Agent configuration files exist
- ✅ System prompts are well-formed
- ✅ Prompts contain required capabilities
- ✅ Tools are properly defined
- ✅ Examples are included
- ✅ Error handling is mentioned
- ✅ Prompt length is reasonable (< 3000 tokens)

## Running Tests

```bash
npm run test:unit
```

## Creating New Tests

Copy `test-email-agent.js` as a template and modify for your agent.

Each test should:
1. Load agent configuration
2. Verify structure
3. Check for key capabilities
4. Validate prompt quality
