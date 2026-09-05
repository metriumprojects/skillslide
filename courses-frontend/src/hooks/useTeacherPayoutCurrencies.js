import { useEffect, useState } from "react";
import api from "../redux/api";

export default function useTeacherPayoutCurrencies() {
  const [payoutCurrencies, setPayoutCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stripePayoutReady, setStripePayoutReady] = useState(false);
  const [hasPaymentSetup, setHasPaymentSetup] = useState(false);

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
