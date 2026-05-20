export interface CADAnalysisResult {
  summary: string;
  materials: string[];
  estimatedCost: string;
  manufacturingComplexity: 'low' | 'medium' | 'high';
  estimatedLeadTime: string;
  keySpecifications: Record<string, string>;
  recommendations: string[];
}

export interface LLMServiceConfig {
  provider: 'openai' | 'gemini';
  apiKey: string;
  model?: string;
}
