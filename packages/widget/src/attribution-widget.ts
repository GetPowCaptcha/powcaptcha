import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { attributionStyles } from './attribution-styles';
import { getBrowserLocale, loadLocale, setLocale, t } from './localization';
import { widgetStyles } from './styles';

@customElement('powcaptcha-attribution-widget')
export class PowCaptchaAttributionWidget extends LitElement {
  static override styles = [widgetStyles, attributionStyles];

  @property({ type: String, attribute: 'data-theme' })
  theme?: 'light' | 'dark' | 'auto' = 'light';

  @property({ type: String, attribute: 'data-locale' })
  locale?: string = undefined;

  constructor() {
    super();
    this.locale ??= getBrowserLocale();
  }

  override updated(changedProperties: Map<string | symbol, unknown>) {
    super.updated(changedProperties);

    if (changedProperties.has('locale')) {
      void loadLocale(this.locale!).then((localeOrError: string | false) => {
        if (localeOrError === false) {
          return;
        }
        setLocale(localeOrError);
        this.requestUpdate();
      });
    }
  }

  override render() {
    const protectedByText = t('widget.footer.protectedBy');

    return html`
      <div class="attribution-container">
        <span>${protectedByText}</span>
        <a
          href="https://powcaptcha.com?utm_source=widget_attribution"
          target="_blank"
          rel="noopener"
          title="${protectedByText} powCAPTCHA"
          aria-label="${protectedByText} powCAPTCHA"
        >
          <svg
            class="attribution-logo"
            width="25"
            height="27"
            viewBox="0 0 30 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>powCAPTCHA Logo</title>
            <path
              d="M8 4C8 1.79086 9.79086 0 12 0H22C26.4183 0 30 3.58172 30 8V8H12C9.79086 8 8 6.20914 8 4V4Z"
              fill="var(--powcaptcha-primary-color)"
            />
            <path
              d="M8 28C8 25.7909 9.79086 24 12 24H19V26.5C19 29.5376 16.5376 32 13.5 32H12C9.79086 32 8 30.2091 8 28V28Z"
              fill="var(--powcaptcha-primary-color)"
            />
            <path
              d="M0 20C0 15.5817 3.58172 12 8 12H30V12C30 16.4183 26.4183 20 22 20H0V20Z"
              fill="var(--powcaptcha-primary-color)"
            />
          </svg>
          powCAPTCHA
        </a>
      </div>
    `;
  }
}
