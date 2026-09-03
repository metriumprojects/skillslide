import React, { useCallback, useEffect, useState } from "react";
import MainLayout from "../../components/MainLayout";
import api from "../../redux/api";
import { toast } from "react-toastify";
import StripeConnectEmbed from "./StripeConnectEmbed";

const formatMinor = (amount, currency) => new Intl.NumberFormat(undefined, {
  style: "currency",
  currency,
}).format(Number(amount || 0) / (currency === "JPY" ? 1 : 100));

export const Withdrawal = () => {
  const [loading, setLoading] = useState(true);
  const [country, setCountry] = useState("");
  const [countries, setCountries] = useState([]);
  const [connect, setConnect] = useState(null);
  const [balance, setBalance] = useState({ available: [], pending: [], payouts: [] });
  const [embedMode, setEmbedMode] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: status }, { data: countryData }] = await Promise.all([
        api.get("/stripe-connect/status", { withCredentials: true }),
        api.get("/stripe-connect/countries", { withCredentials: true }),
      ]);
      setConnect(status.account || null);
      setCountries(countryData.countries || []);
      if (status.account) {
        const { data } = await api.get("/stripe-connect/balance", { withCredentials: true });
        setBalance(data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load Stripe payout setup");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    window.scrollTo(0, 0);
  }, [load]);

  const startEmbeddedFlow = (mode) => {
    if (mode === "onboarding" && !connect && !country) {
      toast.error("Select the country where you legally receive payouts");
      return;
    }
    setEmbedMode(mode);
  };

  const handleEmbedExit = async () => {
    setEmbedMode(null);
    await load();
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Stripe payouts</h1>
        <p className="text-sm text-gray-600 mb-6">
          Add your bank details securely without leaving this page. We never store your full bank details.
        </p>

        {loading ? <p>Loading Stripe account…</p> : !connect ? (
          <section className="rounded-2xl bg-gray-50 border border-gray-200 p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Your legal country</label>
              <select value={country} onChange={(event) => setCountry(event.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3">
                <option value="">Select country</option>
                {countries.map((item) => <option key={item.code} value={item.code}>{item.code} ({item.defaultCurrency})</option>)}
              </select>
              <p className="text-xs text-gray-500 mt-2">This cannot be changed after the Stripe account is created.</p>
            </div>
            {!embedMode ? (
              <button onClick={() => startEmbeddedFlow("onboarding")} className="bg-black text-white rounded-lg px-5 py-3">
                Add bank details
              </button>
            ) : (
              <StripeConnectEmbed mode="onboarding" country={country} onExit={handleEmbedExit} />
            )}
          </section>
        ) : (
          <div className="space-y-6">
            <section className="rounded-2xl bg-gray-50 border border-gray-200 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold">Account status</h2>
                  <p className="text-sm mt-1">Country: {connect.country} · Default currency: {connect.defaultCurrency}</p>
                  <p className={`text-sm mt-1 ${connect.payoutsEnabled ? "text-green-700" : "text-amber-700"}`}>
                    {connect.payoutsEnabled && connect.chargesEnabled ? "Payments and payouts enabled" : "Stripe needs more information"}
                  </p>
                  {connect.disabledReason && <p className="text-sm text-red-700 mt-1">{connect.disabledReason}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(!connect.detailsSubmitted || connect.currentlyDue?.length > 0) && !embedMode && (
                    <button onClick={() => startEmbeddedFlow("onboarding")} className="bg-black text-white rounded-lg px-4 py-2">Complete setup</button>
                  )}
                  {!embedMode && (
                    <button onClick={() => startEmbeddedFlow("management")} className="border border-gray-300 bg-white rounded-lg px-4 py-2">Manage payout account</button>
                  )}
                </div>
              </div>
            </section>

            {embedMode && (
              <StripeConnectEmbed
                mode={embedMode}
                country={connect.country}
                onExit={handleEmbedExit}
              />
            )}

            <section>
              <h2 className="text-xl font-semibold mb-3">Configured payout currencies</h2>
              {connect.externalAccounts?.length ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  {connect.externalAccounts.map((bank) => (
                    <div key={bank.id} className="rounded-xl border border-gray-200 p-4">
                      <p className="font-medium">{bank.bankName} •••• {bank.last4}</p>
                      <p className="text-sm text-gray-600">{bank.currency} · {bank.country} · {bank.status}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-amber-700">Add a payout bank account before publishing paid lessons.</p>}
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Stripe balance</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {[...balance.available.map((item) => ({ ...item, label: "Available" })), ...balance.pending.map((item) => ({ ...item, label: "Pending" }))].map((item, index) => {
                  const currency = String(item.currency).toUpperCase();
                  return <div key={`${item.label}-${currency}-${index}`} className="rounded-xl bg-gray-50 p-4"><p className="text-sm text-gray-500">{item.label}</p><p className="font-semibold">{formatMinor(item.amount, currency)}</p></div>;
                })}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Payout history</h2>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm"><thead className="bg-gray-100"><tr><th className="p-3 text-left">Date</th><th className="p-3 text-left">Amount</th><th className="p-3 text-left">Status</th></tr></thead>
                  <tbody>{balance.payouts?.length ? balance.payouts.map((payout) => <tr key={payout.id} className="border-t"><td className="p-3">{new Date(payout.created * 1000).toLocaleDateString()}</td><td className="p-3">{formatMinor(payout.amount, payout.currency)}</td><td className="p-3 capitalize">{payout.status}</td></tr>) : <tr><td colSpan="3" className="p-4 text-gray-500">No Stripe payouts yet.</td></tr>}</tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Withdrawal;
