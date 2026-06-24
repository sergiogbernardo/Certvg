import { useState } from 'react';
import { parseCsr } from '../lib/csr';
import { useAsyncParse } from '../lib/useAsyncParse';
import { ErrorBox, Field, PemInput, Section } from './ui';

const PLACEHOLDER = '-----BEGIN CERTIFICATE REQUEST-----\nMIIC...\n-----END CERTIFICATE REQUEST-----';

export default function CsrPanel() {
  const [input, setInput] = useState('');
  const { data, error, loading } = useAsyncParse(input, parseCsr);

  return (
    <div className="space-y-4">
      <Section title="Certificate Signing Request (PEM)">
        <PemInput value={input} onChange={setInput} placeholder={PLACEHOLDER} />
        <p className="mt-2 font-mono text-xs text-slate-500">
          Parseado no navegador. O CSR não sai da sua máquina.
        </p>
      </Section>

      {loading && <p className="panel font-mono text-xs text-slate-500">processando…</p>}
      {error && <ErrorBox message={error} />}

      {data && !error && (
        <>
          <Section title="Subject">
            {data.subject.fields.map((f, i) => (
              <Field key={`${f.label}-${i}`} label={f.label} value={f.value} />
            ))}
          </Section>

          {data.san.length > 0 && (
            <Section title="Subject Alternative Names solicitados">
              {data.san.map((s, i) => (
                <Field key={`${s.value}-${i}`} label={s.type} value={s.value} mono />
              ))}
            </Section>
          )}

          <Section title="Chave e assinatura">
            <Field label="Algoritmo da chave" value={data.publicKey.algorithm} />
            <Field label="Tamanho da chave" value={data.publicKey.size} />
            <Field label="Algoritmo de assinatura" value={data.signatureAlgorithm} />
          </Section>
        </>
      )}
    </div>
  );
}
