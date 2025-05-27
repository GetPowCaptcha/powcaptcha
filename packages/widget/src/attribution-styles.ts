import { css } from 'lit';

export const attributionStyles = css`
  :host {
    font-family: var(
      --powcaptcha-font-family,
      ui-sans-serif,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      Roboto,
      'Helvetica Neue',
      Arial,
      'Noto Sans',
      sans-serif
    );
    font-size: 11px;
    line-height: 1;
    color: var(--powcaptcha-footer-text-color);
    background-color: var(--powcaptcha-background-color);
    border: 1px solid var(--powcaptcha-border-color);
    border-radius: 4px;
    display: inline-block;
    color-scheme: light dark;
  }

  .attribution-container {
    display: flex;
    align-items: center;
    gap: 0.4em;
    padding: 4px 8px;
    color: var(--powcaptcha-footer-text-color, #555555);
    transition:
      background-color 0.3s ease,
      border-color 0.3s ease,
      color 0.3s ease;
  }

  .attribution-container span {
    white-space: nowrap;
  }

  .attribution-container a {
    display: inline-flex;
    align-items: center;
    gap: 0.25em;
    color: var(--powcaptcha-primary-color, #4285f4);
    text-decoration: none;
    font-weight: 600;
    white-space: nowrap;
    transition: color 0.3s ease;
  }

  .attribution-container a:hover,
  .attribution-container a:focus {
    text-decoration: underline;
    outline: none;
  }

  .attribution-logo {
    width: 1em;
    height: 1em;
    vertical-align: middle;
    margin-right: 0.1em;
    transition: color 0.3s ease;
  }

  .attribution-container a:hover .attribution-logo,
  .attribution-container a:focus .attribution-logo {
    color: var(--powcaptcha-primary-color);
  }

  .attribution-container a span {
    font-weight: 400;
  }
`;
