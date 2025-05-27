import { css } from 'lit';

export const widgetStyles = css`
  /* Keyframes */
  @keyframes shrink-bounce {
    0% {
      transform: scale(1) rotate(0deg);
    }
    33% {
      transform: scale(0.85);
    }
    100% {
      transform: scale(1) rotate(360deg);
    }
  }
  @keyframes input-check {
    0% {
      transform: scale(0) rotate(-45deg);
    }
    100% {
      transform: scale(1) rotate(-45deg);
    }
  }
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  @keyframes spin-reverse {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(-720deg);
    }
  }

  /* Default Light Mode Variables and Base Styles */
  :host {
    /* Light Mode Colors (Defaults) */
    --powcaptcha-primary-color: #2b59ff;
    --powcaptcha-disabled-color: #ababab;
    --powcaptcha-border-color: #d3d3d3;
    --powcaptcha-background-color: #ffffff;
    --powcaptcha-text-color: #252422;
    --powcaptcha-checkmark-color: #ffffff;
    --powcaptcha-footer-text-color: #ababab;
    --powcaptcha-footer-hover-text-color: #555555;
    --powcaptcha-footer-link-text-color: #252422;
    --powcaptcha-success-color: #0f9d58;
    --powcaptcha-error-color: #db4437;

    /* Dimensions and Fonts */
    --powcaptcha-width: 300px;
    --powcaptcha-height: 74px;
    --powcaptcha-font-family:
      ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
      'Helvetica Neue', Arial, 'Noto Sans', sans-serif;

    display: block;
    font-family: var(--powcaptcha-font-family);
    font-weight: 400;
    font-style: normal;
    color-scheme: light dark;
  }

  /* Styles for invisible host */
  :host([invisible]) {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    clip-path: inset(50%);
    margin: -1px;
    padding: 0;
    border: 0;
    white-space: nowrap;
  }

  /* Box sizing reset */
  :host *,
  :host *::after,
  :host *::before {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  /* Container Styles */
  #container {
    color: var(--powcaptcha-text-color);
    display: flex;
    flex-direction: row;
    align-items: center;
    height: var(--powcaptcha-height);
    width: var(--powcaptcha-width);
    border: 1px solid var(--powcaptcha-border-color);
    background: var(--powcaptcha-background-color);
    border-radius: 4px;
    padding-left: 10px;
    padding-right: 10px;
    gap: 15px;
    position: relative;
    z-index: 0;
    padding: 10px;
    transition:
      background-color 0.3s ease,
      border-color 0.3s ease,
      color 0.3s ease;
  }
  #container.loading {
    cursor: wait;
  }
  #container label {
    font-size: 1rem;
    flex: 1;
    cursor: pointer;
    text-align: left;
  }
  #container label.error {
    color: var(--powcaptcha-error-color);
  }
  #container.loading label {
    cursor: wait;
  }

  button.checkbox {
    appearance: none;
    padding: 0;
    font: inherit;
    color: inherit;
    cursor: pointer;
    display: inline-block;
    width: 25px;
    height: 25px;
    background: var(--powcaptcha-background-color);
    border: 1px solid var(--powcaptcha-border-color);
    position: relative;
    transition: all 0.4s ease;
    border-radius: 4px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  button.checkbox:hover:not(:disabled) {
    border-color: var(--powcaptcha-primary-color);
  }

  /* Disabled state for the button */
  button.checkbox:disabled {
    cursor: default;
    opacity: 0.6;
    border-color: var(--powcaptcha-border-color);
    background-color: var(--powcaptcha-disabled-color);
  }
  button.checkbox:disabled:hover {
    border-color: var(--powcaptcha-border-color);
  }

  button.checkbox.loading {
    cursor: wait;
    background: transparent;
    opacity: 1;
    border-color: var(--powcaptcha-primary-color);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border-width: 2px;
    border-bottom-color: transparent;
    border-left-color: transparent;
    animation: spin 1s linear infinite;
  }

  button.checkbox.loading::after {
    content: ' ';
    display: block;
    width: 60%;
    height: 60%;
    border-width: 2px;
    border-style: solid;
    border-color: var(--powcaptcha-primary-color);
    border-radius: 50%;
    border-top-color: transparent;
    border-right-color: transparent;
    animation: spin-reverse 0.8s linear infinite;
  }

  button.checkbox.validated {
    background: var(--powcaptcha-primary-color);
    border-color: var(--powcaptcha-primary-color);
  }

  /* Checkmark for validated state */
  button.checkbox.validated::before {
    content: ' ';
    display: block;
    width: 13px;
    height: 7px;
    border-bottom: 3px solid var(--powcaptcha-checkmark-color);
    border-left: 3px solid var(--powcaptcha-checkmark-color);
    transform: translate(-50%, -60%) rotate(-45deg);
    opacity: 1;
    animation-name: input-check;
    animation-duration: 0.3s;
    animation-delay: 0.1s;
    animation-fill-mode: forwards;
  }

  /* Logo Styles */
  .logo {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .logo svg path {
    transition: fill 0.3s ease;
    fill: var(--powcaptcha-disabled-color);
  }
  .logo a:hover svg path,
  .logo a:focus svg path {
    fill: var(--powcaptcha-primary-color);
  }

  /* Footer Styles */
  .footer {
    font-size: 12px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    position: absolute;
    bottom: 5px;
    left: 0;
    right: 10px;
    color: var(--powcaptcha-footer-text-color);
    transition: color 0.3s ease;
  }
  .footer a {
    color: var(--powcaptcha-footer-text-color);
    text-decoration: none;
    transition: color 0.3s ease;
  }
  .footer a:hover,
  .footer a:focus {
    color: var(--powcaptcha-footer-hover-text-color);
    text-decoration: underline;
  }
  .footer h1 {
    font-size: 1em;
    font-weight: 700;
    margin: 0;
    letter-spacing: -0.05em;
  }
  .footer a:hover h1,
  .footer a:focus h1 {
    color: var(--powcaptcha-footer-link-text-color);
  }

  /* Loading Progress Styles */
  .loading-progress-container {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s;
    overflow: hidden;
    border-bottom-left-radius: 3px;
    border-bottom-right-radius: 3px;
  }
  .loading-progress-container.loading {
    opacity: 1;
  }
  .loading-progress {
    background-color: var(--powcaptcha-primary-color);
    width: 100%;
    height: 3px;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  /* Accessibility */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    clip-path: inset(50%);
    white-space: nowrap;
    border-width: 0;
  }

  /* Dark Mode */
  :host([data-theme='dark']) {
    --powcaptcha-primary-color: #2b59ff;
    --powcaptcha-disabled-color: #5a5a5a;
    --powcaptcha-border-color: #555555;
    --powcaptcha-background-color: #2d2d2d;
    --powcaptcha-text-color: #e1e1e1;
    --powcaptcha-checkmark-color: #ffffff;
    --powcaptcha-footer-text-color: #9e9e9e;
    --powcaptcha-footer-hover-text-color: #cccccc;
    --powcaptcha-footer-link-text-color: #e1e1e1;
  }

  @media (prefers-color-scheme: dark) {
    :host([data-theme='auto']) {
      --powcaptcha-primary-color: #2b59ff;
      --powcaptcha-disabled-color: #5a5a5a;
      --powcaptcha-border-color: #555555;
      --powcaptcha-background-color: #2d2d2d;
      --powcaptcha-text-color: #e1e1e1;
      --powcaptcha-checkmark-color: #ffffff;
      --powcaptcha-footer-text-color: #9e9e9e;
      --powcaptcha-footer-hover-text-color: #cccccc;
      --powcaptcha-footer-link-text-color: #e1e1e1;
    }
  }
`;
