# powCAPTCHA

**powCAPTCHA** helps keep spam and bots off your website. To stop unwanted activity, it employs behavior analysis, browser fingerprinting, Proof-of-Work challenges, and spam filters.

## 🎯 Features

- **Proof-of-Work:** Client browsers carry out computationally cheap (for them) cryptographic tasks, which together increase the resource cost for automated mass attacks.
- **Privacy-Friendly:** Designed to comply with standard privacy laws by not gathering Personally Identifiable Information (PII).
- **Invisible or Visible:** The widget can be run in the background or displayed.
- **Behavior Signals:** Tracks patterns of user interaction (keyboard events, mouse movements) to distinguish between bot scripts and human behavior.
- **Fingerprinting:** creates a non-PII based device/browser fingerprint.
- **Web Component:** `<powcaptcha-widget>` custom element for simple integration.
- **Works Anywhere:** Designed for compatibility with various web frameworks and vanilla HTML/JavaScript implementations.
- **Multilingual Support:** Ready for different languages.
- **Modern Forms:** Supports Form-Associated Custom Elements.
- **Accessible** Designed with WCAG accessibility in mind.

## 🚀 Getting Started

### 📦 Install

```bash
pnpm add @powcaptcha/widget
```

### Download source code

1. **Fork the repository:**
   In the [powCAPTCHA GitHub repository](https://github.com/GetPowCaptcha/powcaptcha) click the "Fork" button in the top-right corner of the page. This will create a copy of the repository under your GitHub account.

2. **Clone your account repository:**
   ```bash
   git clone https://github.com/[your-username]/powcaptcha.git
   cd powcaptcha
   ```
3. **Install dependencies:**
   ```bash
   pnpm install
   ```

## 📦 Build

```bash

pnpm run build

```

This will generate production ready files in the `dist` directories of each package.

## 🛠️ Development

Start the development environment:

```bash
pnpm run dev:widget
```

## 💡 Widget Usage

1.  **Include script:** Add your compiled script tag to your HTML(you can see and example of this in the `packages/widget/index.html` file). If you prefer to use the powCAPTCHA CDN you can use this:

    ```html
    <script type="module" src="https://js.powcaptcha.com/widget.js"></script>
    ```

2.  **Add it to your form:** Add `<powcaptcha-widget>` element to your form:

    ```html
    <form id="demo-form" method="POST">
      <label for="username">Username:</label>
      <input type="text" id="username" name="username" required />

      <label for="password">Password:</label>
      <input type="password" id="password" name="password" required />

      <powcaptcha-widget data-app-id="YOUR_APP_ID"></powcaptcha-widget>

      <button type="submit">Submit</button>
    </form>
    ```

    > **Note:** Replace `YOUR_APP_ID` with the application ID provided in your app dashboard at [app.powcaptcha.com](https://app.powcaptcha.com). If you are self-hosting, ensure the `data-app-id` value aligns with your custom logic. This attribute must match the ID associated with your application to ensure proper functionality.

3.  **Invisible Mode:** if you are using invisible mode, you'll need to trigger the widget manually before form submission:

    ```javascript
    const form = document.getElementById('demo-form');
    const widget = document.querySelector('powcaptcha-widget');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const token = await widget.execute();
      // Include the token in your form data and submit the form
      form.submit();
    });
    ```

4.  **Backend Verification:** In the backend, verify the `powcaptcha-response` token sent with the form data using your secret key. Refer to the [documentation](https://docs.powcaptcha.com) for detailed backend integration steps.

## 🤝 Contributions

Contributions are welcome. Please open an issue to discuss significant changes or report bugs. If you want to contribute code, fork the repository and submit a Pull Request.

## 📄 License [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/GetPowCaptcha/powcaptcha/blob/main/LICENSE)

This project is licensed under the MIT License. See the `LICENSE` file for details.
