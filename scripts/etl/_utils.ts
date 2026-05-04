import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface SourceHeader {
  _source: string;
  _retrieved: string;
  _url: string;
  _license: string;
  _isDemo: boolean;
  _note?: string;
}

export const ROOT = resolve(import.meta.dirname, '..', '..');

export function dataPath(file: string): string {
  return resolve(ROOT, 'public', 'data', file);
}

export function writeData(file: string, payload: SourceHeader & Record<string, unknown>): void {
  writeFileSync(dataPath(file), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`✓ wrote ${file} (${payload._isDemo ? 'DEMO' : 'REAL'})`);
}

export function readDataIfExists<T = unknown>(file: string): T | null {
  const path = dataPath(file);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

export async function safeFetch(url: string, timeoutMs = 15000): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'AgenteEvalProyectos/1.0' } });
    if (!res.ok) {
      console.warn(`✗ HTTP ${res.status} fetching ${url}`);
      return null;
    }
    return res;
  } catch (err) {
    console.warn(`✗ fetch failed: ${url} → ${(err as Error).message}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
