import { useState } from 'react';
import { parseChain } from '../lib/chain';
import { useAsyncParse } from '../lib/useAsyncParse';
import { Badge, ErrorBox, PemInput, Section } from './ui';

const PLACEHOLDER =
  '-----BEGIN CERTIFICATE-----\n(folha)\n-----END CERTIFICATE-----\n-----BEGIN CERTIFICATE-----\n(intermediária)\n-----END CERTIFICATE-----';

export default function ChainPanel() {
  const [input, setInput] = useState('');
  const { data, error, loading } = useAsyncParse(input, parseChain);

  return (
    <div className="space-y-4">
      <Section title="Bundle de certificados (vários PEMs)">
        <PemInput value={input} onChange={setInput} placeholder={PLACEHOLDER} rows={10} />
        <p className="mt-2 font-mono text-xs text-slate-500">
          Cole a folha + intermediárias (+ raiz). A ordem é reconstruída aqui.
        </p>
      </Section>

      {loading && <p className="panel font-mono text-xs text-slate-500">processando…</p>}
      {error && <ErrorBox message={error} />}

      {data && !error && (
        <Section title="Cadeia reconstruída">
          <div className="mb-3">
            <Badge tone={data.complete ? 'ok' : 'bad'}>
              {data.complete ? 'cadeia ligada' : 'elo faltando'}
            </Badge>
          </div>
          <ol className="space-y-2">
            {data.ordered.map((node, i) => (
              <li key={`${node.subject}-${i}`} className="rounded-lg border border-emerald-500/15 p-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-500">#{i + 1}</span>
                  {node.selfSigned ? (
                    <Badge tone="muted">raiz</Badge>
                  ) : i === 0 ? (
                    <Badge tone="ok">folha</Badge>
                  ) : (
                    <Badge tone="muted">intermediária</Badge>
                  )}
                  <span className="font-mono text-[10px] text-slate-600">exp {node.notAfter}</span>
                </div>
                <p className="mt-1 break-all text-sm text-slate-200">{node.subject}</p>
                {!node.selfSigned && (
                  <p className="mt-0.5 break-all font-mono text-xs text-slate-500">↳ emissor: {node.issuer}</p>
                )}
              </li>
            ))}
          </ol>
          <p className="mt-3 font-mono text-xs text-slate-500">{data.note}</p>
        </Section>
      )}
    </div>
  );
}
