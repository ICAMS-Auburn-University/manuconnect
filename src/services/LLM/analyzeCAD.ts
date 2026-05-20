'use server';

import { CADAnalysisResult } from './types';
import type { SplitAssemblyResult } from '@/domain/cad/types';
import { env } from '@/lib/config/env';
import { logger } from '@/lib/logger';

/**
 * Formats CAD split data into a structured prompt for LLM analysis
 */
function formatCADPrompt(splitData: SplitAssemblyResult): string {
  const partsList = splitData.parts
    .map((p, i) => `${i + 1}. ${p.name} (Path: ${p.storagePath})`)
    .join('\n');

  return `
You are an expert manufacturing engineer. Analyze the following CAD assembly and provide detailed specifications.

Original Assembly: ${splitData.originalPath}
Total Parts: ${splitData.parts.length}

Parts List:
${partsList}

Please provide:
1. A brief summary of the assembly
2. Key materials needed
3. Estimated manufacturing cost (rough estimate)
4. Manufacturing complexity (low/medium/high)
5. Estimated lead time
6. Key specifications for manufacturing
7. Recommendations for optimization

Format your response as JSON with these fields:
{
  "summary": "...",
  "materials": ["...", "..."],
  "estimatedCost": "$...",
  "manufacturingComplexity": "medium",
  "estimatedLeadTime": "...",
  "keySpecifications": {"key": "value"},
  "recommendations": ["...", "..."]
}
`;
}

/**
 * Parses LLM response and extracts CADAnalysisResult
 */
function parseAnalysisResponse(response: string): CADAnalysisResult {
  try {
    // Extract JSON from response (LLM might wrap it in markdown or extra text)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in LLM response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      summary: parsed.summary || 'Assembly analysis complete.',
      materials: Array.isArray(parsed.materials) ? parsed.materials : [],
      estimatedCost: parsed.estimatedCost || 'Not estimated',
      manufacturingComplexity: parsed.manufacturingComplexity || 'medium',
      estimatedLeadTime: parsed.estimatedLeadTime || 'To be determined',
      keySpecifications: parsed.keySpecifications || {},
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations
        : [],
    };
  } catch (error) {
    logger.error('Failed to parse LLM response', error instanceof Error ? error.message : String(error));
    return {
      summary: 'Analysis complete but could not parse results.',
      materials: [],
      estimatedCost: 'Unable to estimate',
      manufacturingComplexity: 'medium',
      estimatedLeadTime: 'Unable to estimate',
      keySpecifications: {},
      recommendations: [],
    };
  }
}

/**
 * Main function to analyze CAD data with LLM
 * Supports OpenAI and Google Gemini
 */
export async function analyzeCADWithLLM(
  splitData: SplitAssemblyResult
): Promise<CADAnalysisResult> {
  const provider = (process.env.LLM_PROVIDER || 'openai') as 'openai' | 'gemini';

  try {
    const prompt = formatCADPrompt(splitData);

    if (provider === 'openai') {
      const response = await analyzeWithOpenAI(prompt);
      return parseAnalysisResponse(response);
    } 
    else {
      throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('LLM analysis failed', errorMessage);
    throw error;
  }
}

/**
 * OpenAI GPT integration
 */
async function analyzeWithOpenAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert manufacturing engineer.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message?.content || '';
}
