import * as x509 from '@peculiar/x509';
import {
  algorithmName,
  keyInfo,
  nameToFields,
  sanEntries,
  type Field,
  type KeyInfo,
  type SanEntry,
} from './pki';

export interface CsrInfo {
  subject: { raw: string; fields: Field[] };
  signatureAlgorithm: string;
  publicKey: KeyInfo;
  san: SanEntry[];
}

export async function parseCsr(pem: string): Promise<CsrInfo> {
  const csr = new x509.Pkcs10CertificateRequest(pem.trim());
  return {
    subject: { raw: csr.subject, fields: nameToFields(csr.subjectName) },
    signatureAlgorithm: algorithmName(csr.signatureAlgorithm),
    publicKey: await keyInfo(csr.publicKey),
    san: sanEntries(csr),
  };
}
