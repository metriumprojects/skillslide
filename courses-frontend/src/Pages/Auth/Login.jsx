import React, { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import MainLayout from "../../components/MainLayout";
import { useDispatch } from "react-redux";
import { getUser, GoogleloginUser, loginUser } from "../../redux/reducers/AuthReducer";
import { toast } from "react-toastify";
import { Eye, EyeOff, Calendar, Mail, User } from "lucide-react";
import GoogleLoginButton from "./GoogleLoginButton";
import CountryAutocomplete from "../Home/Components/CountryAutocomplete";

const LOGO_URL =
  "https://res.cloudinary.com/dinwxxnzm/image/upload/v1784044801/Logo_1_jldcf8.png";

const inputClass =
  "h-[52px] w-full rounded-[10px] border border-zinc-300 bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 font-normal focus:outline-none focus:border-zinc-600 autofill:shadow-[0_0_0_1000px_white_inset]";

const SELLER_SETUP_STEPS = ["name", "dateOfBirth", "country"];

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState("email"); // email | password | sellerSetup
  const [loginAs, setLoginAs] = useState(
    searchParams.get("role") === "teacher" ? "seller" : "buyer"
  ); // buyer(student) | seller(teacher)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleIdToken, setGoogleIdToken] = useState("");
  const [sellerSetupIndex, setSellerSetupIndex] = useState(0);
  const [sellerName, setSellerName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [country, setCountry] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const sellerSetupStep = SELLER_SETUP_STEPS[sellerSetupIndex] || "name";
  const isSellerSetup = step === "sellerSetup";

  const startSellerSetup = useCallback((prefillName = "", idToken = "") => {
    setSellerName(prefillName || "");
    setSellerSetupIndex(0);
    setDateOfBirth("");
    setCountry("");
    setGoogleIdToken(idToken || "");
    setLoginAs("seller");
    setStep("sellerSetup");
  }, []);

  useEffect(() => {
    const state = location.state;
    if (state?.googleSellerSetup && state?.idToken) {
      startSellerSetup(state.buyerName || "", state.idToken);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate, startSellerSetup]);

  const finishLogin = (res, pendingGoogleToken) => {
    if (res.payload?.needsSellerSetup) {
      const token =
        typeof pendingGoogleToken === "string" ? pendingGoogleToken : googleIdToken;
      startSellerSetup(res.payload.buyerName || "", token);
      return;
    }
    if (res.payload?.status) {
      setGoogleIdToken("");
      dispatch(getUser());
      navigate(location.state?.from || "/profile");
      return;
    }
    toast.error(res.payload?.message || "Login failed");
  };

  const handleContinue = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!emailOk) {
      toast.error("Please enter a valid email");
      return;
    }
    setStep("password");
  };

  const handleSignIn = (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill all fields");
      return;
    }

    setLoading(true);
    setGoogleIdToken("");
    dispatch(
      loginUser({
        email: email.trim(),
        password,
        loginAs,
      })
    )
      .then((res) => finishLogin(res, ""))
      .catch(() => {
        toast.error("Something went wrong!");
      })
      .finally(() => setLoading(false));
  };

  const submitSellerSetup = () => {
    setLoading(true);

    const request = googleIdToken
      ? GoogleloginUser({
          id_token: googleIdToken,
          loginAs: "seller",
          sellerName: sellerName.trim(),
          dateOfBirth,
          country: country.trim(),
        })
      : loginUser({
          email: email.trim(),
          password,
          loginAs: "seller",
          sellerName: sellerName.trim(),
          dateOfBirth,
          country: country.trim(),
        });

    dispatch(request)
      .then(finishLogin)
      .catch(() => {
        toast.error("Something went wrong!");
      })
      .finally(() => setLoading(false));
  };

  const handleSellerSetupNext = (e) => {
    e.preventDefault();

    if (sellerSetupStep === "name") {
      if (!sellerName.trim()) {
        toast.error("Please enter your name");
        return;
      }
      setSellerSetupIndex(1);
      return;
    }

    if (sellerSetupStep === "dateOfBirth") {
      if (!dateOfBirth) {
        toast.error("Please enter your date of birth");
        return;
      }
      setSellerSetupIndex(2);
      return;
    }

    if (sellerSetupStep === "country") {
      if (!country.trim()) {
        toast.error("Please enter your country");
        return;
      }
      submitSellerSetup();
    }
  };

  const cancelSellerSetup = () => {
    setLoading(true);

    const request = googleIdToken
      ? GoogleloginUser({
          id_token: googleIdToken,
          loginAs: "buyer",
        })
      : loginUser({
          email: email.trim(),
          password,
          loginAs: "buyer",
        });

    dispatch(request)
      .then((res) => {
        if (res.payload?.status && !res.payload?.needsSellerSetup) {
          setGoogleIdToken("");
          dispatch(getUser());
          navigate("/profile");
          return;
        }
        toast.error(res.payload?.message || "Unable to open student profile");
        setStep("email");
        setLoginAs("buyer");
        setSellerSetupIndex(0);
        setGoogleIdToken("");
      })
      .catch(() => {
        toast.error("Something went wrong!");
      })
      .finally(() => setLoading(false));
  };

  const handleGoogleNeedsSellerSetup = useCallback(
    ({ idToken, buyerName }) => {
      startSellerSetup(buyerName, idToken);
    },
    [startSellerSetup]
  );

  const handleGoogleSuccess = useCallback(() => {
    dispatch(getUser());
    navigate(location.state?.from || "/profile");
  }, [dispatch, location.state, navigate]);

  const onSubmit = isSellerSetup
    ? handleSellerSetupNext
    : step === "email"
      ? handleContinue
      : handleSignIn;

  return (
    <MainLayout hideHeader hideFooter hideMobileMenu contentClassName="!min-h-screen">
      <div className="flex min-h-[calc(100vh-32px)] flex-col justify-between pt-0 pb-5">
        {/* Top: Logo with exact 20px margin from top */}
        {!isSellerSetup && (
          <div className="w-full max-w-xl mx-auto px-2 mt-[20px]">
            <Link to="/" className="inline-flex items-center gap-3 select-none" aria-label="Skillslide home">
              {/* S Orange Icon Badge */}
              <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[10px] bg-[#FA4602]">
                <span className="font-['Roboto'] text-[28px] font-bold italic text-white leading-none">
                  S
                </span>
              </div>

              {/* Skill (italic) + Slide (simple) */}
              <span className="font-['Roboto'] text-[28px] font-black tracking-tight text-[#FA4602] leading-none">
                <span className="italic">Skill</span>
                <span className="not-italic">Slide</span>
              </span>
            </Link>
          </div>
        )}

        {/* Center: Rest of the area centered */}
        <div className="my-auto flex w-full flex-1 items-center justify-center py-6">
          <form
            onSubmit={onSubmit}
            className="flex w-full max-w-xl flex-col gap-6 px-2 text-left text-sm text-[#000000]"
          >

          {isSellerSetup && (
            <>
              <h1 className="text-[32px] font-bold">Create your teacher account</h1>
              <p className="text-[16px] text-gray-500">You do not have a teacher account yet</p>
            </>
          )}

          {!isSellerSetup && (
            <div className="flex w-full max-w-md rounded-full bg-[#F3F3F3] p-1">
              <button
                type="button"
                onClick={() => setLoginAs("buyer")}
                className={`flex-1 rounded-full px-3 py-[10px] text-[16px] font-medium transition-colors ${
                  loginAs === "buyer"
                    ? "bg-white text-black"
                    : "bg-transparent text-gray-600"
                }`}
              >
                Log in as a Student
              </button>
              <button
                type="button"
                onClick={() => setLoginAs("seller")}
                className={`flex-1 rounded-full px-3 py-[10px] text-[16px] font-medium transition-colors ${
                  loginAs === "seller"
                    ? "bg-white text-black"
                    : "bg-transparent text-gray-600"
                }`}
              >
                Log in as a Teacher
              </button>
            </div>
          )}

          {step === "email" && !isSellerSetup && (
            <>
              <GoogleLoginButton
                variant="custom"
                loginAs={loginAs}
                onNeedsSellerSetup={handleGoogleNeedsSellerSetup}
                onSuccess={handleGoogleSuccess}
              />

              <p className="text-left text-[16px] text-black">
                Or
              </p>
            </>
          )}

          {step === "email" && (
            <div className="flex items-center justify-between gap-4 rounded-[20px] bg-[#F4F4F4] px-5 py-[16px] h-[68px] w-full">
              <div className="flex flex-col justify-center gap-[4px] text-left flex-1 min-w-0">
                <label className="text-[14px] font-normal text-black select-none">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  aria-label="Your email address"
                  autoFocus
                  className="w-full text-[14px] font-normal text-zinc-900 bg-transparent outline-none focus:outline-none focus:ring-0 p-0 placeholder:text-zinc-500"
                />
              </div>
              <Mail className="h-5 w-5 text-black shrink-0" />
            </div>
          )}

          {step === "password" && (
            <div className="flex items-center justify-between gap-4 rounded-[20px] bg-[#F4F4F4] px-5 py-[16px] h-[68px] w-full">
              <div className="flex flex-col justify-center gap-[4px] text-left flex-1 min-w-0">
                <label className="text-[14px] font-normal text-black select-none">
                  Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  aria-label="Password"
                  autoFocus
                  className="w-full text-[14px] font-normal text-zinc-900 bg-transparent outline-none focus:outline-none focus:ring-0 p-0 placeholder:text-zinc-500"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="cursor-pointer text-black shrink-0"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          )}

          {isSellerSetup && sellerSetupStep === "name" && (
            <div className="flex items-center justify-between gap-4 rounded-[20px] bg-[#F4F4F4] px-5 py-[16px] h-[68px] w-full">
              <div className="flex flex-col justify-center gap-[4px] text-left flex-1 min-w-0">
                <label className="text-[14px] font-normal text-black select-none">
                  Name
                </label>
                <input
                  type="text"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  placeholder="Your name"
                  aria-label="Your Name"
                  autoFocus
                  className="w-full text-[14px] font-normal text-zinc-900 bg-transparent outline-none focus:outline-none focus:ring-0 p-0 placeholder:text-zinc-500"
                />
              </div>
              <User className="h-5 w-5 text-black shrink-0" />
            </div>
          )}

          {isSellerSetup && sellerSetupStep === "dateOfBirth" && (
            <div
              onClick={() => {
                try {
                  dateInputRef.current?.showPicker?.();
                } catch (_) {
                  dateInputRef.current?.focus();
                }
              }}
              className="flex items-center justify-between gap-4 rounded-[20px] bg-[#F4F4F4] px-5 py-[16px] h-[68px] w-full cursor-pointer select-none"
            >
              <div className="flex flex-col justify-center gap-[4px] text-left flex-1 min-w-0">
                <span className="text-[14px] font-normal text-black select-none">
                  Date of birth
                </span>
                <input
                  ref={dateInputRef}
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  aria-label="Date of birth"
                  autoFocus
                  className="w-full text-[14px] font-normal text-zinc-900 bg-transparent outline-none focus:outline-none focus:ring-0 p-0 cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden"
                />
              </div>
              <Calendar className="h-5 w-5 text-black shrink-0" />
            </div>
          )}

          {isSellerSetup && sellerSetupStep === "country" && (
            <CountryAutocomplete
              value={country}
              onChange={setCountry}
              placeholder="Country"
              className="w-full"
              inputClassName={inputClass}
            />
          )}

          <div className="flex flex-wrap items-center gap-3">
            {step === "password" && (
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setStep("email");
                  setPassword("");
                  setShowPassword(false);
                }}
                className="block w-fit rounded-full bg-black px-12 py-[12px] text-center text-[16px] font-medium text-white transition-all duration-200 disabled:opacity-60"
              >
                Go back
              </button>
            )}
            {isSellerSetup && sellerSetupIndex > 0 && (
              <button
                type="button"
                disabled={loading}
                onClick={() => setSellerSetupIndex((prev) => prev - 1)}
                className="block w-fit rounded-full bg-black px-12 py-[12px] text-center text-[16px] font-medium text-white transition-all duration-200 disabled:opacity-60"
              >
                Go back
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="block w-fit rounded-full bg-[#FA4602] hover:bg-[#e03e02] px-12 py-[12px] text-center text-[16px] font-medium text-white transition-all duration-200 disabled:opacity-60"
            >
              {loading
                ? isSellerSetup
                  ? "Creating..."
                  : "Signing in..."
                : isSellerSetup
                  ? "Next"
                  : "Continue"}
            </button>
          </div>

          <div className="h-px w-full bg-gray-200" />

          {step !== "sellerSetup" && (
            <Link to="/forget" className="block text-[16px] font-normal underline underline-offset-2">
              Forgot password
            </Link>
          )}

          {isSellerSetup ? (
            <p className="text-[16px] font-normal">
              <button
                type="button"
                onClick={cancelSellerSetup}
                className="font-normal text-black underline underline-offset-2"
              >
                Go back to your student profile
              </button>
            </p>
          ) : (
            <p className="text-[16px] font-normal">
              New to Skillslide?{" "}
              <Link
                to={`/register${loginAs === "seller" ? "?role=teacher" : ""}`}
                className="font-normal underline underline-offset-2"
              >
                Create an account
              </Link>
            </p>
          )}
        </form>
        </div>
      </div>
    </MainLayout>
  );
}
