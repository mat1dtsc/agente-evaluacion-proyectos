/**
 * Función serverless del Asesor IA (Vercel Node runtime).
 *
 * Corre SOLO en Vercel / `vercel dev` — nunca se incluye en el bundle del cliente
 * (vive fuera de `src`, fuera del `include` de tsconfig). Guarda la API key en el
 * entorno del servidor; nunca la expone al navegador.
 *
 * Contrato: recibe un AdvisorContext (JSON) por POST y responde un AdvisoryReport.
 *  - 503 si no hay ANTHROPIC_API_KEY  → el cliente cae al motor determinístico.
 *  - 502 si el modelo falla            → el cliente cae al motor determinístico.
 */

import Anthropic from '@anthropic-ai/sdk';

/**
 * Tipos mínimos del runtime de Vercel. Evitamos depender de `@vercel/node`
 * (arrastra ~95 paquetes); el runtime inyecta req/res con esta forma.
 */
interface VercelRequest {
  method?: string;
  body?: unknown;
}
interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (data: unknown) => void;
}

const SYSTEM = [
  'Eres un asesor de evaluación de proyectos retail food en Chile (marco MBA UAH, prof. Mauricio Zúñiga).',
  'Recibes un JSON con la evaluación: ubicación, score geográfico por dimensión, finanzas (VAN/TIR/payback, flujo puro e inversionista), competencia, demanda y drivers de sensibilidad.',
  'Devuelves SOLO un objeto JSON válido — sin markdown ni texto adicional — con EXACTAMENTE estas claves:',
  'veredicto ("Recomendado" | "Aceptable con riesgo" | "No conviene"),',
  'resumen (string de 1-2 frases ejecutivas),',
  'fortalezas (string[]), riesgos (string[]), drivers (string[]) y siguientePaso (string).',
  'Tono ejecutivo y conciso, en español de Chile. Basa TODO en los números entregados; no inventes cifras.',
].join(' ');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'no_api_key' });
    return;
  }

  try {
    const ctx = req.body;
    const client = new Anthropic({ apiKey });
    const model = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5';

    const msg = await client.messages.create({
      model,
      max_tokens: 1000,
      system: SYSTEM,
      messages: [{ role: 'user', content: typeof ctx === 'string' ? ctx : JSON.stringify(ctx) }],
    });

    const block = msg.content.find((c) => c.type === 'text');
    const raw = block && 'text' in block ? block.text : '{}';
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    const parsed = JSON.parse(start >= 0 && end >= 0 ? raw.slice(start, end + 1) : '{}');

    res.status(200).json({ ...parsed, fuente: 'ia' });
  } catch (e) {
    res.status(502).json({ error: 'llm_failed', detail: e instanceof Error ? e.message : String(e) });
  }
}
