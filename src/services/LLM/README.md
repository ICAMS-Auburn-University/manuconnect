# LLM Configuration

This folder contains LLM integration services for analyzing CAD data.

## Setup

### 1. Choose Your Provider

**Option A: OpenAI (Recommended)**
```bash
# Get API key from https://platform.openai.com/api-keys
export OPENAI_API_KEY=sk-...
export OPENAI_MODEL=gpt-4o-mini
export LLM_PROVIDER=openai
```

**Option B: Google Gemini**
```bash
# Get API key from https://ai.google.dev
export GEMINI_API_KEY=...
export GEMINI_MODEL=gemini-pro
export LLM_PROVIDER=gemini
```

### 2. Add to .env.local

```dotenv
# LLM Configuration
LLM_PROVIDER=openai

# OpenAI (if using OpenAI)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Google Gemini (if using Gemini)
# GEMINI_API_KEY=...
# GEMINI_MODEL=gemini-pro
```

### 3. Update .env.example

Add the placeholders to `.env.example` so others know what to configure.

## Files

- **analyzeCAD.ts** - Core LLM service (calls OpenAI or Gemini)
- **types.ts** - TypeScript types for CAD analysis results
- **../../../hooks/cad/useAnalyzeCAD.ts** - React hook for client-side usage

## Usage

### Server-side:
```typescript
import { analyzeCADWithLLM } from '@/services/llm/analyzeCAD';

const result = await analyzeCADWithLLM(splitAssemblyResult);
// result.summary, result.materials, result.estimatedCost, etc.
```

### Client-side:
```typescript
import { useAnalyzeCAD } from '@/hooks/cad/useAnalyzeCAD';

const { analyze, data, isLoading, error } = useAnalyzeCAD();
await analyze(splitAssemblyResult);
```

## Response Format

```json
{
  "summary": "Brief description of the assembly",
  "materials": ["Aluminum", "Steel", "Plastic"],
  "estimatedCost": "$1,500 - $2,500",
  "manufacturingComplexity": "medium",
  "estimatedLeadTime": "4-6 weeks",
  "keySpecifications": {
    "tolerance": "±0.05mm",
    "surface_finish": "Ra 1.6",
    "material": "6061-T6 Aluminum"
  },
  "recommendations": [
    "Consider adding draft angles to injection molded parts",
    "Reduce wall thickness to cut costs"
  ]
}
```
