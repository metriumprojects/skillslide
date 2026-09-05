import React, { useState } from "react";
import api from "../../redux/api";
import { toast } from "react-toastify";
import { FaBuilding, FaCheckCircle, FaLock } from "react-icons/fa";
import { IoArrowBack, IoArrowForward } from "react-icons/io5";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export default function CustomPayoutOnboarding({
  countries = [],
  initialCountry = "US",
  onSuccess,
  onCancel,
}) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    country: initialCountry || "US",
    firstName: "",
    lastName: "",
    email: "",
    phone: "+12065550100",
    dobDay: "15",
    dobMonth: "05",
    dobYear: "1992",
    line1: "123 Market Street",
    line2: "",
    city: "San Francisco",
    state: "CA",
    postalCode: "94103",
    idNumber: "0000",
    accountHolderName: "",
    routingNumber: "110000000",
    accountNumber: "000123456789",
    accountNumberConfirm: "000123456789",
    currency: "USD",
    agreeToTos: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Quick autofill with Stripe test credentials for testing
  const handleFillTestData = () => {
    setFormData({
      country: "US",
      firstName: "Alex",
      lastName: "Hunter",
      email: "alex.hunter.test@example.com",
      phone: "+12065550100",
      dobDay: "12",
      dobMonth: "08",
      dobYear: "1990",
      line1: "123 Innovation Way",
      line2: "Suite 400",
      city: "San Francisco",
      state: "CA",
      postalCode: "94107",
      idNumber: "0000",
      accountHolderName: "Alex Hunter",
      routingNumber: "110000000",
      accountNumber: "000123456789",
      accountNumberConfirm: "000123456789",
      currency: "USD",
      agreeToTos: true,
    });
    toast.info("Filled with official test credentials!");
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (step === 1) {
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        toast.error("Please enter legal first and last name");
        return;
      }
      if (!formData.line1.trim() || !formData.city.trim() || !formData.postalCode.trim()) {
        toast.error("Please complete street address and postal code");
        return;
      }
      if (!formData.idNumber?.trim()) {
        toast.error(
          formData.country === "US"
            ? "Please enter the last 4 digits of your SSN"
            : "Please enter your National ID / Tax ID"
        );
        return;
      }
      if (formData.country === "US" && formData.idNumber.replace(/\D/g, "").length !== 4) {
        toast.error("Please enter exactly 4 digits for SSN (e.g. 0000 for test mode)");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.accountNumber.trim()) {
        toast.error("Please enter your bank account number");
        return;
      }
      if (formData.accountNumber !== formData.accountNumberConfirm) {
        toast.error("Account numbers do not match");
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.agreeToTos) {
      toast.error("Please agree to the Connected Account Terms to proceed");
      return;
    }

    setLoading(true);
    try {
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Payment service could not be initialized.");
      }

      // 1. Create client-side Account Token (required for platforms in France/EU)
      const accountTokenResult = await stripe.createToken("account", {
        business_type: "individual",
        individual: {
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          email: formData.email?.trim() || undefined,
          phone: formData.phone?.trim() || undefined,
          dob: {
            day: Number(formData.dobDay),
            month: Number(formData.dobMonth),
            year: Number(formData.dobYear),
          },
          address: {
            line1: formData.line1.trim(),
            line2: formData.line2?.trim() || undefined,
            city: formData.city.trim(),
            state: formData.state?.trim() || undefined,
            postal_code: formData.postalCode.trim(),
            country: formData.country,
          },
          ...(formData.idNumber?.trim()
            ? formData.country === "US"
              ? { ssn_last_4: formData.idNumber.replace(/\D/g, "").slice(-4) }
              : { id_number: formData.idNumber.trim() }
            : {}),
        },
        tos_shown_and_accepted: true,
      });

      if (accountTokenResult.error) {
        throw new Error(accountTokenResult.error.message);
      }

      // 2. Create client-side Bank Account Token
      let bankTokenId = null;
      if (formData.accountNumber) {
        const bankTokenResult = await stripe.createToken("bank_account", {
          country: formData.country,
          currency: (formData.currency || "USD").toLowerCase(),
          routing_number: formData.routingNumber ? formData.routingNumber.trim() : undefined,
          account_number: formData.accountNumber.trim(),
          account_holder_name: (formData.accountHolderName || `${formData.firstName} ${formData.lastName}`).trim(),
          account_holder_type: "individual",
        });

        if (bankTokenResult.error) {
          throw new Error(bankTokenResult.error.message);
        }
        bankTokenId = bankTokenResult.token.id;
      }

      const payload = {
        country: formData.country,
        accountToken: accountTokenResult.token.id,
        bankToken: bankTokenId,
        firstName: formData.firstName,
        lastName: formData.lastName,
      };

      const { data } = await api.post("/stripe-connect/custom-account", payload, {
        withCredentials: true,
      });

      if (data.status) {
        toast.success("Payout bank account set up successfully!");
        if (onSuccess) onSuccess(data.account);
      } else {
        toast.error(data.message || "Failed to configure custom account");
      }
    } catch (error) {
      console.error("Setup error:", error);
      toast.error(error.response?.data?.message || error.message || "Failed to create payout account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center p-2 rounded-xl bg-black text-white text-sm">
              <FaLock />
            </span>
            <h2 className="text-xl font-bold text-gray-900">Direct Payout Account</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Setup bank payouts directly on SkillSlide with zero third-party redirects.
          </p>
        </div>

        <button
          type="button"
          onClick={handleFillTestData}
          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 transition"
          title="Fills form with test credentials"
        >
          ⚡ Fill Test Data
        </button>
      </div>

      {/* Stepper indicators */}
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
              step >= 1 ? "bg-black text-white" : "bg-gray-200 text-gray-600"
            }`}
          >
            1
          </div>
          <span className={`text-xs font-medium ${step >= 1 ? "text-gray-900" : "text-gray-400"}`}>
            Personal details
          </span>
        </div>

        <div className={`flex-1 h-0.5 mx-3 ${step >= 2 ? "bg-black" : "bg-gray-200"}`} />

        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
              step >= 2 ? "bg-black text-white" : "bg-gray-200 text-gray-600"
            }`}
          >
            2
          </div>
          <span className={`text-xs font-medium ${step >= 2 ? "text-gray-900" : "text-gray-400"}`}>
            Payout details
          </span>
        </div>

        <div className={`flex-1 h-0.5 mx-3 ${step >= 3 ? "bg-black" : "bg-gray-200"}`} />

        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
              step >= 3 ? "bg-black text-white" : "bg-gray-200 text-gray-600"
            }`}
          >
            3
          </div>
          <span className={`text-xs font-medium ${step >= 3 ? "text-gray-900" : "text-gray-400"}`}>
            Review & submit
          </span>
        </div>
      </div>

      <form onSubmit={step === 3 ? handleSubmit : handleNext} className="space-y-5">
        {/* STEP 1: Personal & Legal Details */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Country <span className="text-red-500">*</span>
              </label>
              <select
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black"
              >
                {countries.length > 0 ? (
                  countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.defaultCurrency})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="US">United States (USD)</option>
                    <option value="GB">United Kingdom (GBP)</option>
                    <option value="CA">Canada (CAD)</option>
                    <option value="FR">France (EUR)</option>
                    <option value="DE">Germany (EUR)</option>
                  </>
                )}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Legal first name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First name"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Legal last name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last name"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Email address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="teacher@example.com"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Phone number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+15555555555"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Date of birth <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <input
                    type="number"
                    name="dobDay"
                    value={formData.dobDay}
                    onChange={handleChange}
                    placeholder="Day (DD)"
                    min="1"
                    max="31"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <span className="block text-[10px] text-gray-400 text-center mt-0.5">Day</span>
                </div>
                <div>
                  <input
                    type="number"
                    name="dobMonth"
                    value={formData.dobMonth}
                    onChange={handleChange}
                    placeholder="Month (MM)"
                    min="1"
                    max="12"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <span className="block text-[10px] text-gray-400 text-center mt-0.5">Month</span>
                </div>
                <div>
                  <input
                    type="number"
                    name="dobYear"
                    value={formData.dobYear}
                    onChange={handleChange}
                    placeholder="Year (YYYY)"
                    min="1900"
                    max="2010"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <span className="block text-[10px] text-gray-400 text-center mt-0.5">Year</span>
                </div>
              </div>
            </div>

            {/* Home Address */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Home address <span className="text-red-500">*</span>
              </label>
              <div>
                <input
                  type="text"
                  name="line1"
                  value={formData.line1}
                  onChange={handleChange}
                  placeholder="Address line 1 (Street address)"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <input
                  type="text"
                  name="line2"
                  value={formData.line2}
                  onChange={handleChange}
                  placeholder="Address line 2 (Apartment, suite, unit - optional)"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="State / Province"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    placeholder="Postal code / ZIP"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                {formData.country === "US"
                  ? "Last 4 digits of Social Security number"
                  : "Personal ID number / Tax ID"} <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleChange}
                  required
                  maxLength={formData.country === "US" ? 4 : 25}
                  placeholder={formData.country === "US" ? "0000" : "ID Number"}
                  className="w-36 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black"
                />
                <span className="text-xs text-gray-500">
                  {formData.country === "US"
                    ? "Used to verify your identity (use 0000 in test mode)"
                    : "Required for identity verification"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Payout Bank Account Details */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
              <FaBuilding className="text-gray-500 text-lg" />
              <div>
                <p className="text-xs font-semibold text-gray-800">Bank details for payouts</p>
                <p className="text-xs text-gray-500">Your marketplace earnings will be deposited into this account.</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Account holder name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="accountHolderName"
                value={formData.accountHolderName}
                onChange={handleChange}
                placeholder={`${formData.firstName} ${formData.lastName}`}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                {formData.country === "US"
                  ? "Routing number"
                  : formData.country === "GB"
                  ? "Sort code"
                  : "Routing / Transit number"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="routingNumber"
                value={formData.routingNumber}
                onChange={handleChange}
                placeholder={formData.country === "US" ? "110000000" : "Routing / Sort code"}
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.country === "US"
                  ? "9-digit routing number (use 110000000 in test mode)"
                  : "Bank routing identifier"}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Account number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                placeholder="Account number"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Confirm account number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="accountNumberConfirm"
                value={formData.accountNumberConfirm}
                onChange={handleChange}
                placeholder="Re-enter account number"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>
        )}

        {/* STEP 3: Review & Terms of Service Acceptance */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3 text-sm">
              <h3 className="font-semibold text-gray-900 border-b pb-2">Review details</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <span className="text-gray-500">Legal name:</span>
                <span className="font-medium text-gray-900">
                  {formData.firstName} {formData.lastName}
                </span>

                <span className="text-gray-500">Email address:</span>
                <span className="font-medium text-gray-900">{formData.email || "—"}</span>

                <span className="text-gray-500">Phone number:</span>
                <span className="font-medium text-gray-900">{formData.phone || "—"}</span>

                <span className="text-gray-500">Date of birth:</span>
                <span className="font-medium text-gray-900">
                  {formData.dobMonth}/{formData.dobDay}/{formData.dobYear}
                </span>

                <span className="text-gray-500">Country:</span>
                <span className="font-medium text-gray-900">{formData.country}</span>

                <span className="text-gray-500">Home address:</span>
                <span className="font-medium text-gray-900">
                  {formData.line1}
                  {formData.line2 ? `, ${formData.line2}` : ""}, {formData.city}, {formData.state}{" "}
                  {formData.postalCode}
                </span>

                <span className="text-gray-500">
                  {formData.country === "US" ? "SSN (last 4):" : "Personal ID:"}
                </span>
                <span className="font-mono font-medium text-gray-900">
                  {formData.country === "US" ? `•••• ${formData.idNumber.slice(-4)}` : formData.idNumber}
                </span>

                <span className="text-gray-500">
                  {formData.country === "US" ? "Routing number:" : "Sort / Routing code:"}
                </span>
                <span className="font-mono font-medium text-gray-900">{formData.routingNumber}</span>

                <span className="text-gray-500">Account number:</span>
                <span className="font-mono font-medium text-gray-900">
                  •••• {formData.accountNumber.slice(-4)}
                </span>
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer p-3 bg-gray-50 rounded-xl border border-gray-200">
              <input
                type="checkbox"
                name="agreeToTos"
                checked={formData.agreeToTos}
                onChange={handleChange}
                required
                className="mt-0.5 w-4 h-4 text-black rounded border-gray-300 focus:ring-black"
              />
              <span className="text-xs text-gray-700 leading-relaxed">
                By clicking Agree and submit, you agree to the{" "}
                <a
                  href="https://stripe.com/connect-account/legal"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium underline text-black hover:text-gray-700"
                >
                  Connected Account Agreement
                </a>{" "}
                and confirm that the bank details and identity information provided belong to you.
              </span>
            </label>
          </div>
        )}

        {/* Form Navigation Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
            >
              <IoArrowBack /> Back
            </button>
          ) : (
            onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="text-xs font-semibold text-gray-500 hover:text-gray-800"
              >
                Cancel
              </button>
            )
          )}

          {step < 3 ? (
            <button
              type="submit"
              className="ml-auto flex items-center gap-1.5 text-xs font-semibold px-5 py-2.5 rounded-xl bg-black text-white hover:bg-gray-800 transition"
            >
              Continue <IoArrowForward />
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading || !formData.agreeToTos}
              className="ml-auto flex items-center gap-2 text-xs font-semibold px-6 py-3 rounded-xl bg-black text-white hover:bg-gray-800 disabled:opacity-50 transition"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Continue...
                </>
              ) : (
                <>
                  Continue <IoArrowForward />
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
