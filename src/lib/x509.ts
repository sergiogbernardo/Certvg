import * as x509 from '@peculiar/x509';
import {
  algorithmName,
  bufToHex,
  hashOf,
  keyInfo,
  keyUsages,
  nameToFields,
  sanEntries,
  type Field,
  type KeyInfo,
  type SanEntry,
} from './pki';

export type ValidityState = 'valid' | 'expiring' | 'expired' | 'not-yet';

export interface CertInfo {
  subject: { raw: string; fields: Field[] };
  issuer: { raw: string; fields: Field[] };
  serialNumber: string;
  notBefore: string;
  notAfter: string;
  validity: { state: ValidityState; daysLeft: number };
  signatureAlgorithm: string;
  publicKey: KeyInfo;
  san: SanEntry[];
  keyUsages: string[];
  basicConstraints?: string;
  fingerprints: { sha1: string; sha256: string };
  selfSigned: boolean;
  warnings: string[];
}

const EXPIRY_WARNING_DAYS = 30;

function validityOf(notBefore: Date, notAfter: Date): { state: ValidityState; daysLeft: number } {
  const now = Date.now();
  const daysLeft = Math.floor((notAfter.getTime() - now) / 86_400_000);
  if (now < notBefore.getTime()) return { state: 'not-yet', daysLeft };
  if (now > notAfter.getTime()) return { state: 'expired', daysLeft };
  if (daysLeft <= EXPIRY_WARNING_DAYS) return { state: 'expiring', daysLeft };
  return { state: 'valid', daysLeft };
}

export async function parseCertificate(pem: string): Promise<CertInfo> {
  const cert = new x509.X509Certificate(pem.trim());

  const validity = validityOf(cert.notBefore, cert.notAfter);
  const publicKey = await keyInfo(cert.publicKey);
  const hash = hashOf(cert.signatureAlgorithm);
  const selfSigned = cert.subject === cert.issuer;

  const warnings: string[] = [];
  if (hash === 'SHA-1' || hash === 'MD5') warnings.push(`Assinatura ${hash} (fraca)`);
  const sizeMatch = /(\d+)\s*bits/.exec(publicKey.size);
  if (publicKey.algorithm.includes('RSA') && sizeMatch && Number(sizeMatch[1]) < 2048) {
    warnings.push(`Chave RSA de ${sizeMatch[1]} bits (abaixo de 2048)`);
  }
  if (validity.state === 'expired') warnings.push('Certificado expirado');
  if (validity.state === 'not-yet') warnings.push('Certificado ainda não é válido');

  const bc = cert.getExtension(x509.BasicConstraintsExtension);

  return {
    subject: { raw: cert.subject, fields: nameToFields(cert.subjectName) },
    issuer: { raw: cert.issuer, fields: nameToFields(cert.issuerName) },
    serialNumber: cert.serialNumber,
    notBefore: cert.notBefore.toISOString(),
    notAfter: cert.notAfter.toISOString(),
    validity,
    signatureAlgorithm: algorithmName(cert.signatureAlgorithm),
    publicKey,
    san: sanEntries(cert),
    keyUsages: keyUsages(cert),
    basicConstraints: bc
      ? `CA: ${bc.ca ? 'sim' : 'não'}${bc.pathLength != null ? `, pathlen ${bc.pathLength}` : ''}`
      : undefined,
    fingerprints: {
      sha1: bufToHex(await cert.getThumbprint('SHA-1')),
      sha256: bufToHex(await cert.getThumbprint('SHA-256')),
    },
    selfSigned,
    warnings,
  };
}
