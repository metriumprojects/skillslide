import { useEffect, useState } from "react";
import api from "../redux/api";

let memoryCachedStatus = null;
let memoryCachedCurrencies = null;
let memoryCachedReady = null;

export default function useTeacherPayoutCurrencies() {
  const [payoutCurrencies, setPayoutCurrencies] = useState(() => {
    if (memoryCachedCurrencies) return memoryCachedCurrencies;
    try {
      const stored = sessionStorage.getItem("teacher_payout_currencies");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [hasPaymentSetup, setHasPaymentSetup] = useState(() => {
    if (memoryCachedStatus !== null) return memoryCachedStatus;
    const stored = sessionStorage.getItem("teacher_hasPaymentSetup");
    return stored !== null ? stored === "true" : false;
  });

  const [stripePayoutReady, setStripePayoutReady] = useState(() => {
    if (memoryCachedReady !== null) return memoryCachedReady;
    return sessionStorage.getItem("teacher_stripePayoutReady") === "true";
  });

  const [loading, setLoading] = useState(() => {
    return memoryCachedStatus === null && sessionStorage.getItem("teacher_hasPaymentSetup") === null;
  });

  useEffect(() => {
    let active = true;
    api.get("/stripe-connect/status", { withCredentials: true })
      .then(({ data }) => {
        if (!active) return;
        const account = data.account;
        const currencies = account?.payoutCurrencies || [];
        setPayoutCurrencies(currencies);
        const isReady = Boolean(account?.payoutsEnabled && account?.transfersEnabled && currencies.length);
        setStripePayoutReady(isReady);
        const isFilled = Boolean(
          account &&
          (account.detailsSubmitted ||
            account.externalAccounts?.length > 0 ||
            account.payoutsEnabled ||
            isReady)
        );
        setHasPaymentSetup(isFilled);

        memoryCachedStatus = isFilled;
        memoryCachedCurrencies = currencies;
        memoryCachedReady = isReady;

        try {
          sessionStorage.setItem("teacher_hasPaymentSetup", isFilled ? "true" : "false");
          sessionStorage.setItem("teacher_stripePayoutReady", isReady ? "true" : "false");
          sessionStorage.setItem("teacher_payout_currencies", JSON.stringify(currencies));
        } catch {}
      })
      .catch(() => {
        if (active) {
          setPayoutCurrencies([]);
          setStripePayoutReady(false);
          setHasPaymentSetup(false);
        }
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  return { payoutCurrencies, payoutCurrenciesLoading: loading, stripePayoutReady, hasPaymentSetup };
}
