import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Calendar, User } from "lucide-react";
import MainLayout from "../../components/MainLayout";
import LogoIcon from "../../components/LogoIcon";
import CountryAutocomplete from "../Home/Components/CountryAutocomplete";
import { becomeTeacher, getUser } from "../../redux/reducers/AuthReducer";
import { isSellerProfileComplete } from "../../utils/sellerProfile";

const inputClass =
  "h-[52px] w-full rounded-[10px] border border-zinc-300 bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 font-normal focus:outline-none focus:border-zinc-600 autofill:shadow-[0_0_0_1000px_white_inset]";

const STEPS = ["name", "dateOfBirth", "country"];

const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

export default function CreateTeacherProfile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  const [stepIndex, setStepIndex] = useState(0);
  const [sellerName, setSellerName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const skippedCompleteProfile = useRef(false);
  const dateInputRef = useRef(null);

  const step = STEPS[stepIndex] || "name";

  useEffect(() => {
    if (!userInfo || !isSellerProfileComplete(userInfo) || skippedCompleteProfile.current) return;
    skippedCompleteProfile.current = true;
    dispatch(becomeTeacher("teacher")).then((res) => {
      if (res.payload?.status) {
        dispatch(getUser());
        navigate("/teacher-created");
      }
    });
  }, [dispatch, navigate, userInfo]);

  useEffect(() => {
    if (!userInfo) return;
    setSellerName(
      (prev) =>
        prev ||
        userInfo.sellerName ||
        userInfo.buyerName ||
        userInfo.name ||
        ""
    );
    setDateOfBirth((prev) => prev || toDateInput(userInfo.dateOfBirth));
    setCountry((prev) => prev || userInfo.country || "");
  }, [userInfo]);

  const createTeacher = () => {
    setLoading(true);
    dispatch(
      becomeTeacher({
        role: "teacher",
        sellerName: sellerName.trim(),
        dateOfBirth,
        country: country.trim(),
      })
    )
      .then((res) => {
        if (res.payload?.status) {
          dispatch(getUser());
          navigate("/teacher-created");
          return;
        }
        toast.error(res.payload?.message || "Unable to create teacher profile");
      })
      .catch(() => {
        toast.error("Something went wrong!");
      })
      .finally(() => setLoading(false));
  };

  const handleNext = (e) => {
    e.preventDefault();

    if (step === "name") {
      if (!sellerName.trim()) {
        toast.error("Please enter your name");
        return;
      }
      setStepIndex(1);
      return;
    }

    if (step === "dateOfBirth") {
      if (!dateOfBirth) {
        toast.error("Please enter your date of birth");
        return;
      }
      setStepIndex(2);
      return;
    }

    if (step === "country") {
      if (!country.trim()) {
        toast.error("Please enter your country");
        return;
      }
      createTeacher();
    }
  };

  return (
    <MainLayout hideHeader hideFooter hideMobileMenu contentClassName="!min-h-screen">
      <div className="flex min-h-[calc(100vh-32px)] flex-col pt-0 pb-0">
        {/* Top: Logo with 20px top gap + Teacher account with 20px gap below logo */}
        <div className="w-full max-w-xl mx-auto px-2 mt-[20px] shrink-0">
          <Link to="/" className="inline-flex items-center gap-3 select-none" aria-label="Skillslide home">
            {/* S Orange Icon Badge - Official SVG */}
            <LogoIcon className="h-[46px] w-[46px]" />

            {/* Skill (italic) + Slide (simple) */}
            <span className="font-['Roboto'] text-[28px] font-black tracking-tight text-[#FA4602] leading-none">
              <span className="italic">Skill</span>
              <span className="not-italic">Slide</span>
            </span>
          </Link>

          {/* Create your teacher account 20px below logo, aligned with the logo icon */}
          <div className="mt-[20px]">
            <span className="font-['Roboto'] text-[20px] sm:text-[24px] font-normal text-black tracking-tight leading-none">
              Create your teacher account
            </span>
          </div>
        </div>

        {/* Center: Centered between Teacher account bottom and page bottom */}
        <div className="my-auto flex w-full flex-1 flex-col items-center justify-center py-2">
          <form
            onSubmit={handleNext}
            className="flex w-full max-w-xl flex-col gap-6 px-2 text-left text-sm text-[#000000]"
          >
            {step === "name" && (
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

            <div className="flex flex-wrap items-center gap-3">
              {stepIndex > 0 && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setStepIndex((prev) => prev - 1)}
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
                {loading ? "Creating..." : "Next"}
              </button>
            </div>

            <div className="h-px w-full bg-gray-200" />

            <p className="text-[16px]">
              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="font-medium text-black underline underline-offset-2"
              >
                Go back to your student profile
              </button>
            </p>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
