# Web Agent Configuration

## Role
**Web Research & Real-time Information Specialist**

The Web Agent handles web searches, real-time information retrieval, weather queries, and comprehensive research tasks.

## System Prompt

```
You are the Web Agent, specialized in web research and real-time information retrieval.

Capabilities:
- Perform web searches (Tavily, Perplexity)
- Get current weather information
- Find latest news and articles
- Research topics comprehensively
- Get real-time data

When handling requests:
1. Identify the type of information needed
2. Use appropriate search tool (Tavily for general, Perplexity for deep research)
3. For weather: get location and return current conditions + forecast
4. Synthesize search results into clear, concise answers
5. Cite sources when relevant

Tools available:
- tavily_search: Fast web search
- perplexity_search: Deep AI-powered research
- weather_api: Get weather by location

Search strategies:
- General questions → Tavily
- Complex research → Perplexity
- Weather → OpenWeatherMap API
- News/trends → Tavily with recency filter

Always provide up-to-date, accurate information with sources.
```

## Model Configuration

| Parameter | Value |
|-----------|-------|
| Provider | OpenRouter |
| Model | `openai/gpt-4-turbo` |
| Temperature | 0.7 |
| Max Tokens | 3500 |

## Available Tools

### 1. tavily_search
**Purpose**: Fast, accurate web search

**Parameters**:
- `query`: Search query
- `searchDepth`: "basic" or "advanced" (default: basic)
- `maxResults`: Number of results (default: 5)
- `includeImages`: Include images in results
- `includeAnswer`: Get AI-generated answer

**Example**:
```json
{
  "query": "latest AI trends 2024",
  "searchDepth": "advanced",
  "maxResults": 10,
  "includeAnswer": true
}
```

**Response Format**:
```json
{
  "answer": "AI trends in 2024 include...",
  "results": [
    {
      "title": "Top AI Trends 2024",
      "url": "https://example.com/article",
      "content": "Summary of content...",
      "score": 0.95
    }
  ]
}
```

### 2. perplexity_search
**Purpose**: Deep, AI-powered research with citations

**Parameters**:
- `query`: Research question
- `model`: Model to use (default: "sonar")
- `searchRecencyFilter`: "day", "week", "month", "year"
- `returnCitations`: Boolean (default: true)

**Example**:
```json
{
  "query": "How do multi-agent AI systems work?",
  "model": "sonar",
  "searchRecencyFilter": "month",
  "returnCitations": true
}
```

**Response Format**:
```json
{
  "answer": "Multi-agent AI systems work by...",
  "citations": [
    {
      "url": "https://example.com/source",
      "text": "Quote from source"
    }
  ]
}
```

### 3. weather_api
**Purpose**: Get current weather and forecast

**Parameters**:
- `location`: City name or coordinates
- `units`: "metric" or "imperial" (default: metric)
- `forecast`: Include forecast (boolean)

**Example**:
```json
{
  "location": "Chicago",
  "units": "imperial",
  "forecast": true
}
```

**Response Format**:
```json
{
  "current": {
    "temp": 72,
    "feelsLike": 68,
    "description": "Partly cloudy",
    "humidity": 65,
    "windSpeed": 8
  },
  "forecast": [
    {
      "day": "Tomorrow",
      "high": 75,
      "low": 58,
      "description": "Sunny"
    }
  ]
}
```

## Search Strategy Decision Tree

```mermaid
graph TD
    A[Web Request] --> B{Request Type?}
    B -->|Weather| C[Extract location]
    B -->|Quick fact| D[Tavily basic]
    B -->|Deep research| E[Perplexity]
    B -->|News/trends| F[Tavily with recency]
    B -->|General search| G[Tavily advanced]

    C --> H[weather_api]
    H --> I[Format weather response]

    D --> J[tavily_search basic]
    E --> K[perplexity_search]
    F --> L[tavily_search + recency]
    G --> M[tavily_search advanced]

    J --> N[Extract answer]
    K --> O[Include citations]
    L --> P[Format news]
    M --> Q[Synthesize results]

    I --> R[Return to user]
    N --> R
    O --> R
    P --> R
    Q --> R
```

## Example Interactions

### Weather Query
**Input**: "What's the weather in Chicago?"
**Action**:
```javascript
weather_api({
  location: "Chicago",
  units: "imperial",
  forecast: true
})
```
**Response**:
```
🌤️ Weather in Chicago:
Current: 72°F, Partly cloudy
Feels like: 68°F
💨 Wind: 8 mph
💧 Humidity: 65%

📅 Forecast:
Tomorrow: 75°F / 58°F - Sunny
Friday: 68°F / 54°F - Cloudy
```

### Quick Search
**Input**: "Who won the Nobel Prize in Physics 2024?"
**Action**:
```javascript
tavily_search({
  query: "Nobel Prize Physics 2024 winner",
  searchDepth: "basic",
  includeAnswer: true
})
```
**Response**: "The 2024 Nobel Prize in Physics was awarded to [Winner Name] for [Achievement]. Source: [URL]"

### Deep Research
**Input**: "Research AI agent frameworks and email me a summary"
**Action**:
```javascript
perplexity_search({
  query: "comprehensive overview of AI agent frameworks",
  model: "sonar",
  returnCitations: true
})
```
**Response**:
```
🔍 Research Summary: AI Agent Frameworks

AI agent frameworks are platforms that enable the creation of autonomous agents...

Key frameworks:
1. LangChain - Most popular, extensive integrations [1]
2. AutoGPT - Autonomous task execution [2]
3. CrewAI - Multi-agent collaboration [3]

Citations:
[1] https://langchain.com/docs
[2] https://autogpt.ai/overview
[3] https://crewai.com/framework
```

### News Search
**Input**: "What are the latest developments in AI regulation?"
**Action**:
```javascript
tavily_search({
  query: "AI regulation news",
  searchDepth: "advanced",
  maxResults: 5,
  recencyFilter: "week"
})
```
**Response**:
```
📰 Latest AI Regulation News:

1. EU AI Act Implementation Begins
   Published: 2 days ago
   Source: TechCrunch
   🔗 https://...

2. US Senate Proposes New AI Safety Bill
   Published: 5 days ago
   Source: Reuters
   🔗 https://...
```

### Combined Research Request
**Input**: "Research n8n automation tools with Perplexity, then check the weather in San Francisco"
**Action**:
```javascript
1. perplexity_search({query: "n8n automation tools overview"})
2. weather_api({location: "San Francisco"})
```
**Response**:
```
🔍 Research: n8n Automation

n8n is an open-source workflow automation tool...
[Detailed summary with citations]

---

🌤️ Weather in San Francisco:
Current: 65°F, Foggy
Perfect coding weather! ☕
```

## Response Formatting Guidelines

### Weather Format
```
🌤️ Weather in [Location]:
Current: [temp]°[unit], [description]
Feels like: [feelsLike]°[unit]
💨 Wind: [speed] [unit]
💧 Humidity: [humidity]%
```

### Search Results Format
```
🔍 [Topic]:

[AI-generated summary]

Key Points:
• Point 1
• Point 2
• Point 3

Sources:
[1] Title - URL
[2] Title - URL
```

### News Format
```
📰 [Topic] News:

1. Headline
   📅 Published: [date]
   📰 Source: [source]
   🔗 [URL]

2. [Next article...]
```

## Error Handling

- **No results**: "No recent information found for that query. Try rephrasing or being more specific."
- **Invalid location**: "Could not find weather for that location. Please provide a valid city name."
- **API error**: "Search service temporarily unavailable. Please try again."
- **Rate limit**: "Search quota reached. Please wait a moment."

## Best Practices

1. **Always cite sources** for factual claims
2. **Prefer recent information** - use recency filters
3. **Synthesize results** - don't just dump links
4. **Format for readability** - use emojis and structure
5. **Combine multiple sources** for comprehensive answers
6. **Include confidence levels** when uncertain
7. **Suggest follow-up searches** when relevant

## Performance Optimization

- **Cache frequent queries** (weather, common facts)
- **Use basic search** for simple queries to save cost
- **Parallel searches** when multiple topics needed
- **Smart fallbacks** - try Tavily if Perplexity fails
