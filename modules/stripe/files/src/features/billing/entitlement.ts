// `past_due` is not entitled: access stops while a payment is failing. Change it here if you give a grace period.
export function isEntitled(status: string | undefined): boolean {
  return status === 'active' || status === 'trialing';
}
