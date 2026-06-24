import * as x509 from '@peculiar/x509';
import { splitPems } from './pem';

export interface ChainNode {
  subject: string;
  issuer: string;
  selfSigned: boolean;
  notAfter: string;
}

export interface ChainInfo {
  ordered: ChainNode[];
  complete: boolean;
  note: string;
}

export function parseChain(pem: string): ChainInfo {
  const blocks = splitPems(pem.trim());
  if (blocks.length === 0) throw new Error('Nenhum certificado PEM encontrado no bundle');

  const certs = blocks.map((block) => new x509.X509Certificate(block));
  const bySubject = new Map(certs.map((cert) => [cert.subject, cert]));
  const issuers = new Set(certs.map((cert) => cert.issuer));

  // The leaf is the cert whose subject nobody else points to as issuer.
  const leaf = certs.find((cert) => !issuers.has(cert.subject)) ?? certs[0];

  const ordered: ChainNode[] = [];
  const seen = new Set<string>();
  let current: x509.X509Certificate | undefined = leaf;
  let complete = true;

  while (current && !seen.has(current.subject)) {
    seen.add(current.subject);
    const selfSigned = current.subject === current.issuer;
    ordered.push({
      subject: current.subject,
      issuer: current.issuer,
      selfSigned,
      notAfter: current.notAfter.toISOString().slice(0, 10),
    });
    if (selfSigned) break;
    const next = bySubject.get(current.issuer);
    if (!next) {
      complete = false;
      break;
    }
    current = next;
  }

  const last = ordered[ordered.length - 1];
  const note = !complete
    ? 'Elo faltando: o emissor do último certificado não está no bundle.'
    : last.selfSigned
      ? 'Cadeia completa até a raiz auto-assinada.'
      : 'Cadeia ligada (a raiz auto-assinada não está no bundle, o que é normal).';

  return { ordered, complete, note };
}
