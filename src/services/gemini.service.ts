import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const SYSTEM_PROMPT = `
  Eres JARVIS, un sistema de inteligencia competitiva especializado en el ecosistema de música techno/hardtechno/schranz europeo. 
  Tu función es analizar datos de redes sociales de DJs de referencia y proporcionar insights estratégicos accionables.

  CONTEXTO DEL ECOSISTEMA:
  - Escena: techno industrial, hardtechno, schranz — underground europeo
  - Plataformas clave: Instagram, TikTok, YouTube, SoundCloud, Spotify
  - Métricas críticas: engagement rate, growth velocity, content velocity, viral threshold
  - Sellos referentes: 753, Blackworks, Hard Vision, Gomboc, SCTR, Märked

  REGLAS DE ANÁLISIS:
  1. Nunca des una métrica sin contexto comparativo (ej: "X tiene 8% ER, 3x la media del tier")
  2. Siempre incluye una recomendación accionable junto a cada insight
  3. Detecta patrones, no solo números (qué tipo de contenido, a qué hora, con qué formato)
  4. Identifica señales tempranas antes de que sean tendencias (growth acceleration)
  5. Prioriza insights que el DJ puede implementar en los próximos 7 días

  FORMATO DE RESPUESTA (JSON):
  Responde estrictamente en formato JSON.
  Para analyzeDJ, devuelve un array de objetos JARVISInsight:
  {
    "type": "growth" | "viral" | "engagement" | "strategy",
    "label": string,
    "description": string,
    "recommendation": string,
    "score": number (0-100)
  }
`;

class GeminiService {
  private ai: GoogleGenAI;
  private maxRetries = 3;
  private initialDelay = 1000; // 1 second

  constructor() {
    // In the frontend, process.env.GEMINI_API_KEY is injected by the platform
    const apiKey = (process.env as any).GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY not found in environment. Gemini features may not work.");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: any;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        const errorStr = JSON.stringify(error);
        const isRateLimit = error?.message?.includes('429') || 
                           error?.status === 429 || 
                           error?.error?.code === 429 ||
                           errorStr.includes('429') ||
                           errorStr.includes('RESOURCE_EXHAUSTED') ||
                           (error instanceof Error && error.message.includes('429'));

        if (isRateLimit && attempt < this.maxRetries) {
          const delay = this.initialDelay * Math.pow(2, attempt);
          console.warn(`Gemini Rate Limit (429) hit. Retrying in ${delay}ms... (Attempt ${attempt + 1}/${this.maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
    throw lastError;
  }

  async generateText(prompt: string): Promise<string> {
    return this.withRetry(async () => {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          systemInstruction: SYSTEM_PROMPT
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response text from Gemini");
      return text;
    });
  }

  async analyzeDJ(djData: any): Promise<any[]> {
    return this.withRetry(async () => {
      const prompt = `Analiza el rendimiento de ${djData.name} con los siguientes datos: ${JSON.stringify(djData)}`;
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json"
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response text from Gemini");
      return JSON.parse(text);
    });
  }

  async generateJSON(prompt: string): Promise<any> {
    return this.withRetry(async () => {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json"
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response text from Gemini");
      return JSON.parse(text);
    });
  }
}

export const geminiService = new GeminiService();
