# Certvg

Client-side certificate and token inspector. Paste an X.509 certificate, a CSR
or a JWT and get its details — validity, chain, SAN, algorithms and claims —
**entirely in the browser**. There is no backend; certificates and tokens never
leave your machine.

Part of the [project hub](https://sabion.io/), alongside
[Bytevg](https://sabion.io/Bytevg/),
[Inspectorvg](https://sabion.io/Inspectorvg/) and
[Scanvg](https://sabion.io/Scanvg/).

## Modules

- **X.509 certificate** — Subject/Issuer, validity with an expiry alert (valid /
  expires in N days / expired), SAN, signature algorithm and key size with
  weakness flags (SHA-1, RSA < 2048), SHA-1/SHA-256 fingerprints and Key Usage.
- **Certificate chain** — paste a multi-PEM bundle to order the chain, show who
  signs whom and flag missing links.
- **CSR** — decode a Certificate Signing Request: subject, requested SAN and
  algorithm.
- **JWT** — formatted header and payload, interpreted claims (`exp`/`iat`/`nbf`
  as readable dates with expiry alerts) and signature verification when you
  provide the key/secret.

## Stack

React + TypeScript + Vite + Tailwind, with
[`@peculiar/x509`](https://github.com/PeculiarVentures/x509) (X.509/CSR parsing,
on top of Web Crypto) and [`jose`](https://github.com/panva/jose) (JWT decode and
verification). No backend, no tracking.

Parsing runs on the Web Crypto API; `@peculiar/x509` needs the `reflect-metadata`
polyfill, imported once in `src/main.tsx`.

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build      # outputs to dist/
npm run preview
```

The Vite `base` is `/Certvg/` to match GitHub Pages. Deployment is automated by
`.github/workflows/deploy.yml` on every push to `main`.
