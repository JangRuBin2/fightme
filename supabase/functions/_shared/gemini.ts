const GEMINI_MODEL = 'gemini-2.5-flash';
const MAX_RETRIES = 2;

// --- Zod-like runtime validation (Deno Edge Functions don't bundle npm zod easily) ---

interface SchemaProperty {
  type: 'string' | 'number' | 'integer' | 'boolean';
  description?: string;
}

interface ResponseSchema {
  type: 'object';
  properties: Record<string, SchemaProperty>;
  required: string[];
}

interface GeminiRequestOptions {
  systemPrompt?: string;
  userPrompt: string;
  maxTokens?: number;
  responseSchema?: ResponseSchema;
}

// Gemini API response types
interface GeminiPart {
  text?: string;
}

interface GeminiCandidate {
  content?: { parts?: GeminiPart[] };
  finishReason?: string;
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
}

function validateResponse<T>(data: unknown, schema: ResponseSchema): T {
  if (typeof data !== 'object' || data === null) {
    throw new Error(`Expected object, got ${typeof data}`);
  }

  const obj = data as Record<string, unknown>;
  const errors: string[] = [];

  for (const key of schema.required) {
    if (!(key in obj) || obj[key] === undefined || obj[key] === null) {
      errors.push(`Missing required field: ${key}`);
    }
  }

  for (const [key, prop] of Object.entries(schema.properties)) {
    if (!(key in obj)) continue;
    const value = obj[key];
    const expectedType = prop.type === 'integer' ? 'number' : prop.type;
    if (typeof value !== expectedType) {
      errors.push(`Field "${key}": expected ${prop.type}, got ${typeof value}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }

  return data as T;
}

async function callGeminiOnce(
  url: string,
  body: Record<string, unknown>
): Promise<{ text: string; truncated: boolean }> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${errorText}`);
  }

  const data: GeminiResponse = await response.json();
  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts
    ?.map((p) => p.text ?? '')
    .join('') ?? '';
  const truncated = candidate?.finishReason === 'MAX_TOKENS';

  if (!text) {
    throw new Error('Empty response from Gemini API');
  }

  return { text, truncated };
}

export async function callGemini(options: GeminiRequestOptions): Promise<string> {
  const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY is not set');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  let maxTokens = options.maxTokens || 4096;

  const generationConfig: Record<string, unknown> = {
    maxOutputTokens: maxTokens,
    temperature: 0.7,
    responseMimeType: 'application/json',
  };

  if (options.responseSchema) {
    generationConfig.responseSchema = options.responseSchema;
  }

  const body: Record<string, unknown> = {
    contents: [
      {
        role: 'user',
        parts: [{ text: options.userPrompt }],
      },
    ],
    generationConfig,
  };

  if (options.systemPrompt) {
    body.systemInstruction = {
      parts: [{ text: options.systemPrompt }],
    };
  }

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const { text, truncated } = await callGeminiOnce(url, body);

    if (!truncated) {
      return text;
    }

    console.warn(`Gemini response truncated (attempt ${attempt + 1}), doubling maxOutputTokens`);
    maxTokens *= 2;
    generationConfig.maxOutputTokens = maxTokens;
  }

  const { text } = await callGeminiOnce(url, body);
  return text;
}

export function extractJson<T>(text: string, schema?: ResponseSchema): T {
  let parsed: unknown;

  // Try direct parse first (responseMimeType: application/json)
  try {
    parsed = JSON.parse(text);
  } catch {
    // Fallback: extract JSON from mixed text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      const err = new Error('Failed to parse JSON from Gemini response');
      (err as Record<string, unknown>).geminiRaw = text.slice(0, 500);
      throw err;
    }
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      const err = new Error('Invalid JSON in Gemini response');
      (err as Record<string, unknown>).geminiRaw = text.slice(0, 500);
      throw err;
    }
  }

  if (schema) {
    return validateResponse<T>(parsed, schema);
  }

  return parsed as T;
}
