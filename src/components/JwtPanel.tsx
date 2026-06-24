import { useMemo, useState } from 'react';
import { decode, verify, type JwtInfo, type VerifyResult } from '../lib/jwt';
import { Badge, ErrorBox, Field, PemInput, Section } from './ui';

const PLACEHOLDER = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0In0.SflKxwR...';

function Json({ value }: { value: Record<string, unknown> }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-emerald-500/15 bg-black/50 p-3 font-mono text-xs text-emerald-200">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export default function JwtPanel() {
  const [token, setToken] = useState('');
  const [key, setKey] = useState('');
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [verifying, setVerifying] = useState(false);

  const decoded = useMemo<{ data: JwtInfo | null; error: string | null }>(() => {
    const trimmed = token.trim();
    if (!trimmed) return { data: null, error: null };
    try {
      return { data: decode(trimmed), error: null };
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : 'JWT inválido' };
    }
  }, [token]);

  const runVerify = async () => {
    setVerifying(true);
    setResult(null);
    try {
      setResult(await verify(token.trim(), key));
    } finally {
      setVerifying(false);
    }
  };

  const isHmac = decoded.data?.alg.startsWith('HS');

  return (
    <div className="space-y-4">
      <Section title="JSON Web Token">
        <PemInput value={token} onChange={setToken} placeholder={PLACEHOLDER} rows={4} />
        <p className="mt-2 font-mono text-xs text-slate-500">
          Decodificado no navegador. A verificação é opcional e também local.
        </p>
      </Section>

      {decoded.error && <ErrorBox message={decoded.error} />}

      {decoded.data && (
        <>
          <Section title="Header">
            <Json value={decoded.data.header} />
          </Section>

          <Section title="Payload">
            <Json value={decoded.data.payload} />
          </Section>

          {decoded.data.claims.length > 0 && (
            <Section title="Claims interpretados">
              {decoded.data.claims.map((c, i) => (
                <Field key={`${c.label}-${i}`} label={c.label} value={c.value} />
              ))}
            </Section>
          )}

          <Section title="Verificar assinatura">
            <p className="mb-2 text-sm text-slate-400">
              {isHmac
                ? 'Algoritmo HMAC — informe o segredo compartilhado.'
                : 'Algoritmo assimétrico — cole a chave pública (PEM/SPKI).'}
            </p>
            <PemInput
              value={key}
              onChange={setKey}
              placeholder={isHmac ? 'segredo HMAC' : '-----BEGIN PUBLIC KEY-----'}
              rows={isHmac ? 2 : 5}
            />
            <button
              type="button"
              onClick={runVerify}
              disabled={!key || verifying}
              className="mt-3 rounded-lg bg-emerald-400/15 px-4 py-2 font-mono text-xs uppercase tracking-wider text-emerald-300 transition hover:bg-emerald-400/25 disabled:opacity-40"
            >
              {verifying ? 'verificando…' : 'verificar'}
            </button>
            {result && (
              <div className="mt-3 flex items-center gap-2">
                <Badge tone={result.ok ? 'ok' : 'bad'}>{result.ok ? 'válida' : 'inválida'}</Badge>
                <span className="text-sm text-slate-300">{result.message}</span>
              </div>
            )}
          </Section>
        </>
      )}
    </div>
  );
}
