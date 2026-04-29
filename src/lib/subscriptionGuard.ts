export const checkSubscriptionAccess = (org: any) => {
  if (!org) return { allowed: false };

  const now = new Date();

  // ACTIVE → allow
  if (org.subscription_status === "active") {
    if (!org.subscription_end_date) return { allowed: true };

    const end = new Date(org.subscription_end_date);
    return { allowed: end > now };
  }

  // TRIAL → check expiry
  if (org.subscription_status === "trial") {
    if (!org.trial_end_date) return { allowed: true };

    const trialEnd = new Date(org.trial_end_date);
    return { allowed: trialEnd > now };
  }

  // pending / expired / cancelled → block
  return { allowed: false };
};