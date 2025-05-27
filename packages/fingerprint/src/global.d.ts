interface Window {
  ApplePaySession: ApplePaySessionInterface;
}

interface ApplePaySessionInterface {
  canMakePayments: () => boolean;
  canMakePaymentsWithActiveCard: () => boolean;
}
