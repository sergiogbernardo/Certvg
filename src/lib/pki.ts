import * as x509 from '@peculiar/x509';

// Shared helpers used by the X.509, chain and CSR parsers.

export interface Field {
  label: string;
  value: string;
}

export interface KeyInfo {
  algorithm: string;
  size: string;
}

export interface SanEntry {
  type: string;
  value: string;
}

const DN_LABELS: Record<string, string> = {
  CN: 'Common Name (CN)',
  O: 'Organization (O)',
  OU: 'Org Unit (OU)',
  C: 'Country (C)',
  L: 'Locality (L)',
  ST: 'State (ST)',
  E: 'E-mail',
  emailAddress: 'E-mail',
};

export function bufToHex(buffer: ArrayBuffer, separator = ':'): string {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(separator)
    .toUpperCase();
}

export function nameToFields(name: x509.Name): Field[] {
  const fields: Field[] = [];
  for (const entry of name.toJSON()) {
    for (const [key, values] of Object.entries(entry)) {
      const label = DN_LABELS[key] ?? key;
      for (const value of values as string[]) {
        fields.push({ label, value });
      }
    }
  }
  return fields;
}

export function algorithmName(algo: x509.HashedAlgorithm): string {
  const hash = algo.hash;
  const hashName = typeof hash === 'object' && hash ? hash.name : hash;
  return hashName ? `${hashName} · ${algo.name}` : algo.name;
}

export function hashOf(algo: x509.HashedAlgorithm): string {
  const hash = algo.hash;
  return (typeof hash === 'object' && hash ? hash.name : String(hash ?? '')).toUpperCase();
}

export async function keyInfo(publicKey: x509.PublicKey): Promise<KeyInfo> {
  const name = publicKey.algorithm.name;
  try {
    const cryptoKey = await publicKey.export();
    const algo = cryptoKey.algorithm as { modulusLength?: number; namedCurve?: string };
    if (algo.modulusLength) return { algorithm: name, size: `${algo.modulusLength} bits` };
    if (algo.namedCurve) return { algorithm: name, size: algo.namedCurve };
  } catch {
    // Key export can fail for exotic algorithms; fall back to "unknown size".
  }
  return { algorithm: name, size: '—' };
}

const SAN_OID = '2.5.29.17';

function mapNames(names: x509.GeneralNames): SanEntry[] {
  return names.items.map((n) => ({ type: n.type.toUpperCase(), value: n.value }));
}

export function sanEntries(
  container: x509.X509Certificate | x509.Pkcs10CertificateRequest,
): SanEntry[] {
  // Both certificates and CSRs expose the SAN as an Extension whose value is the
  // GeneralNames DER (for CSRs it comes from the extensionRequest attribute).
  // Parsing the value uniformly avoids the typed-getExtension overload mismatch
  // between the two container types.
  const ext = container.extensions.find((e) => e.type === SAN_OID);
  if (!ext) return [];
  return mapNames(new x509.GeneralNames(ext.value));
}

const KEY_USAGE_FLAGS: [number, string][] = [
  [1, 'digitalSignature'],
  [2, 'nonRepudiation'],
  [4, 'keyEncipherment'],
  [8, 'dataEncipherment'],
  [16, 'keyAgreement'],
  [32, 'keyCertSign'],
  [64, 'cRLSign'],
  [128, 'encipherOnly'],
  [256, 'decipherOnly'],
];

export function keyUsages(cert: x509.X509Certificate): string[] {
  const ext = cert.getExtension(x509.KeyUsagesExtension);
  if (!ext) return [];
  return KEY_USAGE_FLAGS.filter(([flag]) => (ext.usages & flag) !== 0).map(([, name]) => name);
}
