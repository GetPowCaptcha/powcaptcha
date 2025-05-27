import { html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { live } from 'lit/directives/live.js';

import { detectNonSecureContextCryptoPolyfill } from '@powcaptcha/crypto';
import { createLogger } from '@powcaptcha/logger';
import { type CollectedSignalData, Signals } from '@powcaptcha/signals';

import {
  ChallengeOrchestrator,
  type OrchestratorCallbacks,
  type OrchestratorConfig,
} from './challenge-orchestrator';
import { getBrowserLocale, loadLocale, setLocale, t } from './localization';
import { widgetStyles } from './styles';
import type { ErrorDetail, SolvedDetail, SolveProgressDetail } from './types';

const Logger = createLogger('widget:widget');

/**
 * PowCaptchaWidget is the main custom web component powCAPTCHA.
 *
 * @extends {LitElement}
 * @implements {FormAssociated}
 */
@customElement('powcaptcha-widget')
export class PowCaptchaWidget extends LitElement {
  // Form Associated Custom Element
  static formAssociated = true;

  static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  // Properties

  /**
   * The application ID associated with the widget.
   * @property
   * @type {string}
   * @attribute data-app-id
   * @required
   */
  @property({ type: String, attribute: 'data-app-id' })
  appId?: string;

  /**
   * Indicates whether the widget should operate in invisible mode.
   * When set to `true`, the widget will not be visible on the page,
   * but it will still function in the background.
   * Defaults to `false`.
   *
   * @property
   * @type {boolean | undefined}
   * @attribute data-invisible
   * @default false
   */
  @property({ type: Boolean, attribute: 'data-invisible' })
  invisible?: boolean = false;

  /**
   * By default, the widget will not allow form submission until it is validated.
   *
   * @property
   * @type {boolean | undefined}
   * @attribute data-invisible-allow-submit
   * @default false
   */
  @property({ type: Boolean, attribute: 'data-invisible-allow-submit' })
  invisibleAllowSubmit?: boolean = false;

  /**
   * The locale property specifies the language and regional settings for the widget.
   * It is an optional string that can be set via the `data-locale` attribute.
   *
   * @property
   * @type {string | undefined}
   * @attribute data-locale
   */
  @property({ type: String, attribute: 'data-locale' })
  locale?: string = undefined;

  /**
   * The `data-detect-required-fields` attribute indicates whether the widget should
   * automatically detect required fields in the form. If set to `true`, the widget
   * will check for required fields and validate them before allowing submission.
   *
   * @property
   * @type {boolean | undefined}
   * @attribute data-detect-required-fields
   * @default true
   */
  @property({ type: Boolean, attribute: 'data-detect-required-fields' })
  detectRequiredFields?: boolean = true;

  /**
   * The `data-theme` attribute specifies the theme of the widget.
   * It can be set to `light`, `dark`, or `auto`.
   *
   * @property
   * @type {string | undefined}
   * @attribute data-theme
   * @default 'light'
   * @enum {string}
   * @enumValues ['light', 'dark', 'auto']
   * @description
   * - `light`: Light theme
   * - `dark`: Dark theme
   * - `auto`: Automatically adapts to the user's system theme
   */
  @property({ type: String, attribute: 'data-theme' })
  theme?: 'light' | 'dark' | 'auto' = 'light';

  /**
   * The `data-backend-url` attribute specifies the backend URL for the widget.
   * It is an optional string that can be set via the `data-backend-url` attribute.
   *
   * @property
   * @type {string | undefined}
   * @attribute data-backend-url
   */
  @property({ type: String, attribute: 'data-backend-url' })
  backendUrl?: string =
    (import.meta.env.VITE_BACKEND_URL as string) ?? 'https://api.powcaptcha.com';

  /**
   * The `data-context` attribute specifies the context for powCAPTCHA.
   * @property
   * @type {string | undefined}
   * @attribute data-context
   */
  @property({ type: String, attribute: 'data-context' })
  context?: string = undefined;

  @property({ reflect: true })
  name = 'powcaptcha-response';

  // State
  @state() private _loading = false;
  @state() private _loadingProgress = 0;
  @state() private _validated = false; // Still needed for UI state
  @state() private _statusMessage = '';
  @state() private _isSubmittingProgrammatically = false;
  @state() private _token: string | null = null; // Still needed
  @state() private _errorMessage: string | null = null; // Still needed

  // Internal Properties
  private _formElement: HTMLFormElement | HTMLElement | null = null;
  private _boundHandleFormSubmit: (event: SubmitEvent) => void;
  private _boundHandleClick: (event: MouseEvent) => void;
  private _executionPromise: Promise<string> | null = null;
  private _signals?: Signals;
  private _signalsData: CollectedSignalData = {};

  private _internals: ElementInternals;
  private _orchestrator?: ChallengeOrchestrator;

  // Styles
  static override styles = [widgetStyles];

  constructor() {
    detectNonSecureContextCryptoPolyfill();
    super();

    this._internals = this.attachInternals();

    this.locale ??= getBrowserLocale();

    this._boundHandleFormSubmit = (event: SubmitEvent) => {
      void this._handleFormSubmit(event);
    };
    this._boundHandleClick = (/* event: MouseEvent */) => {
      void this._handleClick();
    };
  }

  // Lifecycle Callbacks
  override firstUpdated(changedProperties: Map<string | symbol, unknown>) {
    super.firstUpdated(changedProperties);
    this._updateValidity(false, t('widget.status.verificationRequired'));
    this._initializeOrchestrator();
  }

  override updated(changedProperties: Map<string | symbol, unknown>) {
    super.updated(changedProperties);

    if (
      this._orchestrator &&
      (changedProperties.has('appId') || changedProperties.has('backendUrl'))
    ) {
      Logger.log('Updating orchestrator config due to property change.');
      this._initializeOrchestrator(true);
    }
    if (changedProperties.has('locale')) {
      void loadLocale(this.locale!).then((localeOrError: string | false) => {
        if (localeOrError === false) {
          this.locale = 'en';
          Logger.error('Failed to load locale:', this.locale);
          return;
        }
        // this method should be in render
        // setLocale(localeOrError);
        this.requestUpdate();
      });
    }
  }

  override connectedCallback() {
    super.connectedCallback();
    Logger.log('connectedCallback');

    if (this.hasUpdated) {
      this._findFormAndAttachListeners();
      return;
    }
    this._findFormAndAttachListeners();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    Logger.log('disconnectedCallback');
    this._signals?.finalizeCollection();
    this._detachEventListeners();
    this._formElement = null;
  }

  // FACE Callbacks
  formResetCallback() {
    Logger.log('formResetCallback triggered');
    this.reset();
  }

  formDisabledCallback(disabled: boolean) {
    Logger.log('formDisabledCallback triggered', disabled);
    this.toggleAttribute('disabled', disabled);
  }

  // Public Focus Methods
  override focus(options?: FocusOptions): void {
    if (!this.invisible) {
      this.shadowRoot?.getElementById('powcaptcha-checkbox-button')?.focus(options);
    } else {
      Logger.log('Focus called on invisible widget, doing nothing.');
    }
  }

  // Private Methods
  private _initializeOrchestrator(force = false): void {
    // Avoid re-initializing if already present unless forced
    if (this._orchestrator && !force) return;
    // Ensure required properties are available
    if (!this.appId) {
      Logger.error('Cannot initialize orchestrator: data-app-id is missing.');
      this._statusMessage = t('widget.error.config');
      // Prevent initialization if key is missing
      this._orchestrator = undefined;
      return;
    }

    Logger.log(
      force ? 'Re-initializing Challenge Orchestrator...' : 'Initializing Challenge Orchestrator...'
    );
    const config: OrchestratorConfig = {
      appId: this.appId,
      backendUrl: this.backendUrl,
      context: this.context,
    };
    const callbacks: OrchestratorCallbacks = {
      onLoadingChange: (loading) => {
        this._loading = loading;
        if (!loading) {
          this._loadingProgress = this._validated ? 100 : 0;
        } else {
          this._loadingProgress = 0;
        }
      },
      onStatusUpdate: (message) => {
        this._statusMessage = message;
      },
      onProgress: (progress) => {
        this._loadingProgress = progress;
        this.requestUpdate();
        this.dispatchEvent(
          new CustomEvent<SolveProgressDetail>('@powcaptcha/widget/solving/progress', {
            detail: { progress },
            bubbles: true,
            composed: true,
          })
        );
      },
      onSolved: (token) => {
        this._setValidationState(true, token, t('widget.status.verificationSuccessful'));
        this.dispatchEvent(
          new CustomEvent<SolvedDetail>('@powcaptcha/widget/solved', {
            detail: { token },
            bubbles: true,
            composed: true,
          })
        );
      },
      onError: (error, message) => {
        Logger.error('Orchestrator reported error:', error);
        this._setValidationState(false, null, message || t('widget.status.verificationFailed'));
        this._errorMessage = error.message;
        this.dispatchEvent(
          new CustomEvent<ErrorDetail>('@powcaptcha/widget/error', {
            detail: { error },
            bubbles: true,
            composed: true,
          })
        );
      },
    };
    this._orchestrator = new ChallengeOrchestrator(config, callbacks);
  }

  private _findFormAndAttachListeners(): void {
    requestAnimationFrame(() => {
      this._formElement = this._internals.form;
      if (this._formElement) {
        Logger.log('Parent form found.');
        this._initializeSignals();
        this._attachEventListeners();
      } else {
        Logger.warn('Parent <form> not found.');
      }
    });
  }

  /** Sets up Signals listener */
  private _initializeSignals(): void {
    if (!this._formElement || this._signals) return;
    this._signals = new Signals();
    this._signals.collect(this._formElement, 0, (_collectedData) => {
      this._signalsData = _collectedData;
      Logger.log('Signals data collected.', _collectedData);
    });
    Logger.log('Signals collector initialized.');
  }

  /** Attaches event listeners based on mode */
  private _attachEventListeners(): void {
    if (!this._formElement) return;
    this._detachEventListeners();

    if (this.invisible) {
      if (!this.invisibleAllowSubmit) {
        Logger.log('Invisible mode, attaching submit listener.');
        (this._formElement as HTMLFormElement).addEventListener(
          'submit',
          this._boundHandleFormSubmit,
          { capture: true }
        );
      }
    } else {
      Logger.log('Visible mode, attaching click listener to host.');
      this.addEventListener('click', this._boundHandleClick);
    }
  }

  /** Detaches event listeners */
  private _detachEventListeners(): void {
    if (this._formElement && this.invisible) {
      try {
        (this._formElement as HTMLFormElement).removeEventListener(
          'submit',
          this._boundHandleFormSubmit,
          { capture: true }
        );
        Logger.log('Removed submit listener.');
      } catch {
        /* ignore */
      }
    } else {
      try {
        this.removeEventListener('click', this._boundHandleClick);
        Logger.log('Removed click listener from host.');
      } catch {
        /* ignore */
      }
    }
  }

  /** Sets loading state */
  private _setLoadingState(isLoading: boolean): void {
    this._loading = isLoading;
    if (!isLoading) {
      this._loadingProgress = this._validated ? 100 : 0;
    } else {
      this._loadingProgress = 0;
    }
  }

  /** Sets validated state, form value/input, validity, and accessibility message */
  private _setValidationState(isValid: boolean, token: string | null, statusMsg: string): void {
    this._validated = isValid;
    this._token = token;
    this._statusMessage = statusMsg;
    this._loadingProgress = isValid ? 100 : 0;

    this._internals.setFormValue(token);
    this._updateValidity(isValid, statusMsg);
  }

  private _updateValidity(isValid: boolean, validationMessage: string) {
    if (isValid) {
      this._internals.setValidity({});
      Logger.log('FACE Validity set to: VALID');
    } else {
      const checkboxButton = this.invisible
        ? undefined
        : (this.shadowRoot?.getElementById('powcaptcha-checkbox-button') as
            | HTMLButtonElement
            | undefined);
      this._internals.setValidity({ customError: true }, validationMessage, checkboxButton);
      Logger.log(`FACE Validity set to: INVALID ('${validationMessage}')`);
    }
  }
  /**
   * Detects required fields in the form and checks their validity.
   * This will help to collect signals and will stop the user to click directly on the widget in visible mode.
   */
  private _detectRequiredFields(): boolean {
    if (!this._formElement) {
      Logger.warn('Form element not found, cannot detect required fields. Returning true.');
      return true;
    }
    // If detectRequiredFields is manually disabled
    if (!this.detectRequiredFields) {
      return true;
    }

    const requiredFields = this._formElement.querySelectorAll<Element>('[required]');

    if (requiredFields) {
      try {
        requiredFields.forEach((field) => {
          if (
            !(
              'checkValidity' in field &&
              'reportValidity' in field &&
              typeof field.checkValidity === 'function' &&
              typeof field.reportValidity === 'function'
            )
          ) {
            return;
          }
          // check if the field is valid
          if (!(field as HTMLInputElement).checkValidity()) {
            (field as HTMLInputElement).reportValidity();
            throw new Error('Required field is invalid');
          }
        });
      } catch {
        return false;
      }
    }

    return true;
  }

  // Event Handlers
  private async _handleClick(/* _event: MouseEvent */) {
    if (this.invisible) return;
    if (this._validated && this._token) {
      Logger.log('Click ignored (validated).');
      return;
    }
    if (this._loading) {
      Logger.log('Click ignored (loading).');
      return;
    }

    Logger.log('Checkbox button clicked...');

    this._setValidationState(false, null, t('widget.status.verificationRequired'));

    this._errorMessage = null;

    if (!this._orchestrator) {
      Logger.error('Orchestrator not initialized!');
      this._setValidationState(false, null, t('widget.status.componentNotInitialized'));
      return;
    }

    const requiredFieldsValid = this._detectRequiredFields();
    if (!requiredFieldsValid) {
      Logger.warn('Required fields are invalid, preventing click.');
      return;
    }

    try {
      this._signals?.finalizeCollection();
      this.dispatchEvent(new CustomEvent('@powcaptcha/widget/solving'));
      await this._orchestrator.solve(this._signalsData);
    } catch (error) {
      Logger.error('Error during click handling (orchestrator call):', error);
    }
  }

  private async _handleFormSubmit(event: SubmitEvent) {
    if (!this.invisible || !this._formElement) {
      return;
    }
    Logger.log('Invisible submit intercepted.');

    if (this._isSubmittingProgrammatically) {
      Logger.log('Programmatic submit detected, allowing default.');
      this._isSubmittingProgrammatically = false;
      return;
    }

    if (!this._validated || !this._token) {
      event.preventDefault();
      event.stopImmediatePropagation();
      Logger.log('Default submission prevented (invisible, not validated).');

      this._updateValidity(false, t('widget.status.verificationRequired'));
      if (!this._internals.checkValidity()) {
        Logger.warn('Submit prevented by checkValidity.');
        this._statusMessage = this._internals.validationMessage;
        return;
      }

      if (this._loading) {
        Logger.warn('Already processing. Submit ignored.');
        this._statusMessage = 'Verification already in progress.';
        return;
      }

      this._setValidationState(false, null, t('widget.status.verificationRequired'));

      if (!this._orchestrator) {
        Logger.error('Orchestrator not initialized!');
        this._setValidationState(false, null, t('widget.status.componentNotInitialized'));
        return;
      }
      try {
        this.dispatchEvent(new CustomEvent('@powcaptcha/widget/solving')); // Dispatch solving event from component
        const token = await this._orchestrator.solve(this._signalsData);

        Logger.log('Challenge solved on submit. Resubmitting form.');
        this._isSubmittingProgrammatically = true;
        const formElement = this._formElement as HTMLFormElement;
        if (formElement) {
          if (typeof formElement.requestSubmit === 'function') {
            formElement.requestSubmit();
          } else if (typeof formElement.submit === 'function') {
            formElement.submit();
          } else {
            Logger.warn('Form submission methods are not available.');
          }
        } else {
          Logger.error('Form element is not defined.');
        }

        this.dispatchEvent(
          new CustomEvent<SolvedDetail>('@powcaptcha/widget/solved', {
            detail: { token },
            bubbles: true,
            composed: true,
          })
        );
      } catch (error) {
        Logger.error('Error during submit handling (orchestrator call):', error);
      }
    } else {
      Logger.log('Invisible already validated. Allowing form submission.');
      this.dispatchEvent(
        new CustomEvent<SolvedDetail>('@powcaptcha/widget/solved', {
          detail: { token: this._token },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  // Public API Methods

  /**
   * Checks whether the widget is currently in a loading state.
   *
   * @returns {boolean} `true` if the widget is loading, otherwise `false`.
   */
  public isLoading(): boolean {
    return this._loading;
  }
  /**
   * Checks if the widget has been successfully validated.
   *
   * @returns {boolean} `true` if the widget is validated, otherwise `false`.
   */
  public isValidated(): boolean {
    return this._validated;
  }

  /**
   * Executes the widget's main functionality programmatically.
   *
   * This method handles the execution flow, including validation checks,
   * orchestrator interaction, and state management. It ensures that the
   * widget is in a valid state before proceeding and manages asynchronous
   * operations using a promise.
   *
   * @returns {Promise<string>} A promise that resolves with the generated token
   * if the execution is successful, or rejects with an error if the execution fails.
   *
   * @throws {Error} If the component is not initialized or if an execution is
   * already in progress.
   *
   * - If the widget is already validated and a token exists, the method resolves
   *   immediately with the token.
   * - If the widget is validated but the token is missing, it resets the widget state.
   * - If the orchestrator is not initialized, the method rejects with an error.
   *
   * The method also dispatches a custom event (`@powcaptcha/widget/solving`)
   * to signal the start of the solving process.
   */
  public async execute(): Promise<string> {
    Logger.log('Programmatic execute() called.');
    if (this._loading) {
      Logger.warn('execute() called while loading.');
      return this._executionPromise ?? Promise.reject(new Error('Execution already in progress.'));
    }
    // Check internal state
    if (this._validated && this._token) {
      Logger.log('execute() called when validated.');
      this._setValidationState(true, this._token, t('widget.status.verificationSuccessful'));
      return Promise.resolve(this._token);
    } else if (this._validated && !this._token) {
      Logger.warn('Validated but token missing, resetting.');
      this.reset();
    }

    if (!this._orchestrator) {
      Logger.error('Orchestrator not initialized!');
      this._setValidationState(false, null, t('widget.status.componentNotInitialized'));
      return Promise.reject(new Error('Component not initialized.'));
    }

    const requiredFieldsValid = this._detectRequiredFields();
    if (!requiredFieldsValid) {
      Logger.warn('Required fields are invalid, preventing click.');
      return Promise.reject(new Error('Required fields are invalid.'));
    }

    this._executionPromise = (async () => {
      try {
        this._signals?.finalizeCollection();
        this.dispatchEvent(new CustomEvent('@powcaptcha/widget/solving'));
        const token = await this._orchestrator!.solve(this._signalsData);
        return token;
      } finally {
        this._executionPromise = null;
      }
    })();
    return this._executionPromise;
  }

  /**
   * Resets the widget to its initial state.
   *
   * This method performs the following actions:
   * - Resets the internal state, form value/input, and validity.
   * - Updates the validation state with appropriate messages based on the widget's configuration.
   * - Clears the loading state and execution promise.
   * - Resets the orchestrator's state, if applicable.
   * - Requests a UI update to reflect the changes.
   *
   */
  public reset(): void {
    Logger.log('reset() called.');

    if (!this.invisible) {
      this._setValidationState(
        false,
        null,
        t('widget.status.reset') + ' ' + t('widget.status.verificationRequired')
      );
    } else {
      this._setValidationState(false, null, t('widget.status.reset'));

      this._internals.setValidity({});
    }
    this._setLoadingState(false);
    this._executionPromise = null;
    this._orchestrator?.reset();
    this.requestUpdate();
  }

  public getResponse(): string | null {
    return this._token;
  }

  override render() {
    // Re-set the locale in case there is multiple widgets with differents languages in the same page.
    setLocale(this.locale!);

    if (this.invisible) {
      return html`
        <div
          class="status-message sr-only"
          aria-live="polite"
          aria-atomic="true"
          aria-relevant="text"
        >
          ${this._statusMessage}
        </div>
      `;
    }

    const buttonClasses = {
      checkbox: true,
      loading: this._loading,
      validated: this._validated,
    };
    const labelText = this._errorMessage ?? t('widget.checkbox.label');

    const protectedByText = t('widget.footer.protectedBy');

    const checkboxId = 'powcaptcha-checkbox-button';
    const labelId = 'powcaptcha-checkbox-label';

    return html`
      <div
        id="container"
        class="${classMap({
          loading: this._loading,
          validated: this._validated,
        })}"
        tabindex="-1"
      >
        <button
          id="${checkboxId}"
          class="${classMap(buttonClasses)}"
          role="checkbox"
          aria-checked="${live(this._validated ? 'true' : 'false')}"
          aria-labelledby="${labelId}"
          ?disabled="${this._loading}"
          type="button"
        ></button>
        <label
          id="${labelId}"
          class="${classMap({ error: !!this._errorMessage })}"
          for="${checkboxId}"
        >
          ${labelText}
        </label>
        <div class="logo">
          <a
            href="https://powcaptcha.com?utm_source=widget&utm_medium=referral&utm_campaign=widget"
            target="_blank"
            title="${protectedByText}"
            aria-label="${protectedByText}"
            tabindex="-1"
          >
            <svg
              width="25"
              height="27"
              viewBox="0 0 30 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>${protectedByText} powCAPTCHA</title>
              <path
                d="M8 4C8 1.79086 9.79086 0 12 0H22C26.4183 0 30 3.58172 30 8V8H12C9.79086 8 8 6.20914 8 4V4Z"
                fill="var(--primary-color)"
              />
              <path
                d="M8 28C8 25.7909 9.79086 24 12 24H19V26.5C19 29.5376 16.5376 32 13.5 32H12C9.79086 32 8 30.2091 8 28V28Z"
                fill="var(--primary-color)"
              />
              <path
                d="M0 20C0 15.5817 3.58172 12 8 12H30V12C30 16.4183 26.4183 20 22 20H0V20Z"
                fill="var(--primary-color)"
              />
            </svg>
          </a>
        </div>
        <div class="footer">
          <span>${protectedByText}</span>&nbsp;

          <a
            href="https://powcaptcha.com?utm_source=widget&utm_medium=referral&utm_campaign=widget"
            target="_blank"
            title="${protectedByText} powCAPTCHA"
            tabindex="-1"
            ><h1>powCAPTCHA</h1></a
          >
        </div>
        ${this._loading
          ? html`<div class="loading-progress-container loading">
              <div
                class="loading-progress"
                style="transform:translateX(-${100 - this._loadingProgress}%)"
              ></div>
            </div>`
          : nothing}
        <div
          class="status-message sr-only"
          aria-live="polite"
          aria-atomic="true"
          aria-relevant="text"
        >
          ${this._statusMessage}
        </div>
      </div>
    `;
  }
}
