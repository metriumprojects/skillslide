import React, { useMemo, useRef, useState } from "react";
import { Eye, EyeOff, Calendar, Mail, User } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import MainLayout from "../../components/MainLayout";
import { useDispatch } from "react-redux";
import { registerUser } from "../../redux/reducers/AuthReducer";
import { toast } from "react-toastify";
import GoogleLoginButton from "./GoogleLoginButton";
import CountryAutocomplete from "../Home/Components/CountryAutocomplete";

const LOGO_URL =
  "https://res.cloudinary.com/dinwxxnzm/image/upload/v1784044801/Logo_1_jldcf8.png";

const inputClass =
  "h-[52px] w-full rounded-[10px] border border-zinc-300 bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 font-normal focus:outline-none focus:border-zinc-600 autofill:shadow-[0_0_0_1000px_white_inset]";

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialRole = searchParams.get("role") === "teacher" ? "seller" : "buyer";

  const [registerAs, setRegisterAs] = useState(initialRole); // buyer(student) | seller(teacher)
  const [stepIndex, setStepIndex] = useState(0);
  const dateInputRef = useRef(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [country, setCountry] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const role = registerAs === "seller" ? "teacher" : "user";

  const steps = useMemo(
    () =>
      registerAs === "seller"
        ? ["name", "email", "dateOfBirth", "country", "password"]
        : ["name", "email", "password"],
    [registerAs]
  );

  const step = steps[stepIndex] || "name";
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === steps.length - 1;

  const handleRoleChange = (nextRole) => {
    setRegisterAs(nextRole);
    setStepIndex(0);
    setDateOfBirth("");
    setCountry("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirm(false);
  };

  const validateCurrentStep = () => {
    if (step === "name") {
      if (!name.trim()) {
        toast.error("Please enter your name");
        return false;
      }
      return true;
    }

    if (step === "email") {
      if (!email.trim()) {
        toast.error("Please enter your email");
        return false;
      }
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
      if (!emailOk) {
        toast.error("Please enter a valid email");
        return false;
      }
      return true;
    }

    if (step === "dateOfBirth") {
      if (!dateOfBirth) {
        toast.error("Please enter your date of birth");
        return false;
      }
      return true;
    }

    if (step === "country") {
      if (!country.trim()) {
        toast.error("Please enter your country");
        return false;
      }
      return true;
    }

    if (step === "password") {
      if (!password || !confirmPassword) {
        toast.error("Please fill all fields");
        return false;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords don't match");
        return false;
      }
      return true;
    }

    return true;
  };

  const handleSignUp = () => {
    setLoading(true);
    const payload = {
      name: name.trim(),
      email: email.trim(),
      password,
      role,
    };
    if (registerAs === "seller") {
      payload.dateOfBirth = dateOfBirth;
      payload.country = country.trim();
    }

    dispatch(registerUser(payload))
      .then((res) => {
        if (res.payload.status) {
          toast.success(res.payload.message);
          navigate("/login");
        } else {
          toast.error(res.payload.message);
        }
      })
      .catch(() => {
        toast.error("Something went wrong!");
      })
      .finally(() => setLoading(false));
  };

  const handleContinue = (e) => {
    e.preventDefault();
    if (!validateCurrentStep()) return;

    if (isLastStep) {
      handleSignUp();
      return;
    }

    setStepIndex((prev) => prev + 1);
  };

  const handleGoBack = () => {
    if (isFirstStep) return;
    setStepIndex((prev) => prev - 1);
    if (step === "password") {
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirm(false);
    }
  };

  return (
    <MainLayout hideHeader hideFooter hideMobileMenu contentClassName="!min-h-screen">
      <div className="flex min-h-[calc(100vh-32px)] flex-col justify-between pt-0 pb-5">
        {/* Top: Logo with exact 20px margin from top */}
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

        {/* Center: Rest of the area centered */}
        <div className="my-auto flex w-full flex-1 items-center justify-center py-6">
          <form
            onSubmit={handleContinue}
            className="flex w-full max-w-xl flex-col gap-6 px-2 text-left text-sm text-[#000000]"
          >

          {isFirstStep && (
            <div className="flex w-full max-w-md rounded-full bg-[#F3F3F3] p-1">
              <button
                type="button"
                onClick={() => handleRoleChange("buyer")}
                className={`flex-1 rounded-full px-3 py-[10px] text-[16px] font-medium transition-colors ${registerAs === "buyer"
                    ? "bg-white text-black"
                    : "bg-transparent text-gray-600"
                  }`}
              >
                Sign up as a Student
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange("seller")}
                className={`flex-1 rounded-full px-3 py-[10px] text-[16px] font-medium transition-colors ${registerAs === "seller"
                    ? "bg-white text-black"
                    : "bg-transparent text-gray-600"
                  }`}
              >
                Sign up as a Teacher
              </button>
            </div>
          )}

          {isFirstStep && (
            <>
              <GoogleLoginButton
                variant="custom"
                loginAs={registerAs}
                onNeedsSellerSetup={({ idToken, buyerName }) => {
                  navigate("/login", {
                    state: {
                      googleSellerSetup: true,
                      idToken,
                      buyerName,
                    },
                  });
                }}
                onSuccess={() => navigate("/")}
              />

              <p className="text-left text-[16px] text-black">
                Or
              </p>
            </>
          )}

          {step === "name" && (
            <div className="flex items-center justify-between gap-4 rounded-[20px] bg-[#F4F4F4] px-5 py-[16px] h-[68px] w-full">
              <div className="flex flex-col justify-center gap-[4px] text-left flex-1 min-w-0">
                <label className="text-[14px] font-normal text-black select-none">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  aria-label="Your Name"
                  autoFocus
                  className="w-full text-[14px] font-normal text-zinc-900 bg-transparent outline-none focus:outline-none focus:ring-0 p-0 placeholder:text-zinc-500"
                />
              </div>
              <User className="h-5 w-5 text-black shrink-0" />
            </div>
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

          {step === "dateOfBirth" && (
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

          {step === "country" && (
            <CountryAutocomplete
              value={country}
              onChange={setCountry}
              placeholder="Country"
              className="w-full"
              inputClassName={inputClass}
            />
          )}

          {step === "password" && (
            <>
              <div className="flex items-center justify-between gap-4 rounded-[20px] bg-[#F4F4F4] px-5 py-[16px] h-[68px] w-full">
                <div className="flex flex-col justify-center gap-[4px] text-left flex-1 min-w-0">
                  <label className="text-[14px] font-normal text-black select-none">
                    Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
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
              <div className="flex items-center justify-between gap-4 rounded-[20px] bg-[#F4F4F4] px-5 py-[16px] h-[68px] w-full">
                <div className="flex flex-col justify-center gap-[4px] text-left flex-1 min-w-0">
                  <label className="text-[14px] font-normal text-black select-none">
                    Confirm Password
                  </label>
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    aria-label="Confirm password"
                    className="w-full text-[14px] font-normal text-zinc-900 bg-transparent outline-none focus:outline-none focus:ring-0 p-0 placeholder:text-zinc-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  className="cursor-pointer text-black shrink-0"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {!isFirstStep && (
              <button
                type="button"
                disabled={loading}
                onClick={handleGoBack}
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
              {loading ? "Creating..." : "Continue"}
            </button>
          </div>

          <div className="h-px w-full bg-gray-200" />

          {isFirstStep && (
            <p className="text-[16px] text-gray-600">
              By entering and clicking Continue, you agree to the{" "}
              <Link to="/terms-of-service" className="text-black underline underline-offset-2">
                Terms
              </Link>{" "}
              &{" "}
              <Link to="/privacy-policy" className="text-black underline underline-offset-2">
                Privacy Policy
              </Link>
            </p>
          )}

          <p className="text-[16px] font-normal">
            Already have an account?{" "}
            <Link to="/login" className="font-normal underline underline-offset-2">
              Log in
            </Link>
          </p>
        </form>
        </div>
      </div>
    </MainLayout>
  );
}
