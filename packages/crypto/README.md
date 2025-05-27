# @powcaptcha/crypto

Crypto module for hashing and encoding

```bash
npm install @powcaptcha/crypto
# or
yarn add @powcaptcha/crypto
# or
pnpm add @powcaptcha/crypto
```

```javascript
import { sha256 } from '@powcaptcha/crypto';

const data = 'Hello, powCAPTCHA!';
const hash = await sha256(data);
console.log(`SHA-256 Hash: ${hash}`);
```
