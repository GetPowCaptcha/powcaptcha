# @powcaptcha/fingerprint

The **powCAPTCHA Fingerprint** module is a lightweight library designed to generate unique identifiers for users or devices based on non-invasive browser and system characteristics. This module is a core component of the powCAPTCHA project, enhancing security and usability by enabling device fingerprinting for CAPTCHA validation.

## Project Description

The main idea is to collect browser data to generate a fingerprint on the server side. This fingerprint is primarily used to detect bots, not to track users. Tracking users with this library would be very difficult since its objective is not user tracking.

This module collects minimal, privacy-friendly attributes such as:

- Browser user agent
- Canvas fingerprint
- Audio fingerprint
- Timezone
- Language settings

These attributes are combined and hashed to create a unique fingerprint in the server. The fingerprint is used to:

- Differentiate between users or devices.
- Prevent repeated CAPTCHA attempts from the same source.
- Enhance security without relying on cookies or intrusive tracking methods.

## Installation
``bash
pnpm add @powcaptcha/fingerprint
``