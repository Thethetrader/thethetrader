declare function gtag(...args: unknown[]): void;

function ga(...args: unknown[]) {
  if (typeof gtag !== 'undefined') {
    gtag(...args);
  }
}

export function trackPageView(path: string, title: string) {
  ga('event', 'page_view', {
    page_path: path,
    page_title: title,
    page_location: window.location.href,
  });
}

export function trackBeginCheckout(plan: string, price: number, billingPeriod: 'monthly' | 'yearly') {
  ga('event', 'begin_checkout', {
    currency: 'EUR',
    value: price,
    items: [{ item_id: plan, item_name: `TPLN ${plan}`, price, quantity: 1 }],
    billing_period: billingPeriod,
  });
}

export function trackPurchase(sessionId: string) {
  ga('event', 'purchase', {
    transaction_id: sessionId,
    currency: 'EUR',
  });
}

export function trackLogin() {
  ga('event', 'login', { method: 'email' });
}

export function trackSignUp() {
  ga('event', 'sign_up', { method: 'email' });
}

export function trackOpenAuthModal(source: string) {
  ga('event', 'open_auth_modal', { source });
}

export function trackCTAClick(label: string, location: string) {
  ga('event', 'cta_click', { label, location });
}
