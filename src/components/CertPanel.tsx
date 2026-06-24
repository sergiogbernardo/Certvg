import { useState } from 'react';
import { parseCertificate, type ValidityState } from '../lib/x509';
import { useAsyncParse } from '../lib/useAsyncParse';
import CopyButton from './CopyButton';
import { Badge, ErrorBox, Field, PemInput, Section } from './ui';

const VALIDITY: Record<ValidityState, { tone: 'ok' | 'warn' | 'bad'; text: string }> = {
  valid: { tone: 'ok', text: 'válido' },
  expiring: { tone: 'warn', text: 'expira em breve' },
  expired: { tone: 'bad', text: 'expirado' },
  'not-yet': { tone: 'warn', text: 'ainda não válido' },
};

const PLACEHOLDER = '-----BEGIN CERTIFICATE-----\nMIID...\n-----END CERTIFICATE-----';

export default function CertPanel() {
  const [input, setInput] = useState('');
  const { data, error, loading } = useAsyncParse(input, parseCertificate);

  return (
    <div className="space-y-4">
      <Section title="Certificado X.509 (PEM)">
        <PemInput value={input} onChange={setInput} placeholder={PLACEHOLDER} />
        <p className="mt-2 font-mono text-xs text-slate-500">
          Tudo é parseado no navegador. Nenhum byte é enviado.
        </p>
      </Section>

      {loading && <p className="panel font-mono text-xs text-slate-500">processando…</p>}
      {error && <ErrorBox message={error} />}

      {data && !error && (
        <>
          <Section title="Validade">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge tone={VALIDITY[data.validity.state].tone}>
                {VALIDITY[data.validity.state].text}
              </Badge>
              {data.validity.state === 'valid' && (
                <span className="font-mono text-xs text-slate-500">
                  {data.validity.daysLeft} dias restantes
                </span>
              )}
              {data.selfSigned && <Badge tone="muted">auto-assinado</Badge>}
            </div>
            <Field label="Não antes de" value={data.notBefore} mono />
            <Field label="Não depois de" value={data.notAfter} mono />
          </Section>

          {data.warnings.length > 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
              <ul className="list-inside list-disc text-sm text-amber-300">
                {data.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <Section title="Subject">
            {data.subject.fields.map((f, i) => (
              <Field key={`${f.label}-${i}`} label={f.label} value={f.value} />
            ))}
          </Section>

          <Section title="Issuer">
            {data.issuer.fields.map((f, i) => (
              <Field key={`${f.label}-${i}`} label={f.label} value={f.value} />
            ))}
          </Section>

          {data.san.length > 0 && (
            <Section title="Subject Alternative Names">
              {data.san.map((s, i) => (
                <Field key={`${s.value}-${i}`} label={s.type} value={s.value} mono />
              ))}
            </Section>
          )}

          <Section title="Chave e assinatura">
            <Field label="Algoritmo da chave" value={data.publicKey.algorithm} />
            <Field label="Tamanho da chave" value={data.publicKey.size} />
            <Field label="Algoritmo de assinatura" value={data.signatureAlgorithm} />
            <Field label="Número de série" value={data.serialNumber} mono />
            {data.basicConstraints && (
              <Field label="Basic Constraints" value={data.basicConstraints} />
            )}
            {data.keyUsages.length > 0 && (
              <Field label="Key Usage" value={data.keyUsages.join(', ')} />
            )}
          </Section>

          <Section title="Fingerprints">
            <div className="space-y-2">
              {(['sha1', 'sha256'] as const).map((algo) => (
                <div key={algo}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-mono text-xs uppercase tracking-wider text-slate-500">
                      {algo === 'sha1' ? 'SHA-1' : 'SHA-256'}
                    </span>
                    <CopyButton value={data.fingerprints[algo]} />
                  </div>
                  <code className="block break-all font-mono text-xs text-emerald-300">
                    {data.fingerprints[algo]}
                  </code>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
