import { decodeJwt, decodeProtectedHeader, importSPKI, jwtVerify } from 'jose';

export interface JwtClaim {
  label: string;
  value: string;
}

export interface JwtInfo {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  alg: string;
  claims: JwtClaim[];
}

const TIME_CLAIMS: Record<string, string> = {
  iat: 'Emitido em (iat)',
  nbf: 'Válido a partir de (nbf)',
  exp: 'Expira em (exp)',
};

export function decode(token: string): JwtInfo {
  const header = decodeProtectedHeader(token) as Record<string, unknown>;
  const payload = decodeJwt(token) as Record<string, unknown>;
  const parts = token.split('.');

  const claims: JwtClaim[] = [];
  for (const [key, label] of Object.entries(TIME_CLAIMS)) {
    const value = payload[key];
    if (typeof value === 'number') {
      const date = new Date(value * 1000);
      let extra = '';
      if (key === 'exp') extra = date.getTime() < Date.now() ? ' — EXPIRADO' : ' — válido';
      if (key === 'nbf') extra = date.getTime() > Date.now() ? ' — ainda não válido' : '';
      claims.push({ label, value: date.toISOString() + extra });
    }
  }
  for (const key of ['iss', 'sub', 'aud']) {
    if (payload[key] != null) {
      claims.push({ label: key.toUpperCase(), value: String(payload[key]) });
    }
  }

  return {
    header,
    payload,
    signature: parts[2] ?? '',
    alg: typeof header.alg === 'string' ? header.alg : '—',
    claims,
  };
}

export interface VerifyResult {
  ok: boolean;
  message: string;
}

export async function verify(token: string, keyMaterial: string): Promise<VerifyResult> {
  const { alg } = decodeProtectedHeader(token);
  if (!alg) return { ok: false, message: 'Token sem algoritmo (alg) no header' };
  try {
    const key = alg.startsWith('HS')
      ? new TextEncoder().encode(keyMaterial)
      : await importSPKI(keyMaterial.trim(), alg);
    await jwtVerify(token, key);
    return { ok: true, message: `Assinatura válida (${alg})` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Falha na verificação' };
  }
}
