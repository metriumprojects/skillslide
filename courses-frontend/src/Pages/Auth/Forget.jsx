import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "../../components/MainLayout";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { Mail } from "lucide-react";
import { forgetPassword } from "../../redux/reducers/AuthReducer";

const inputClass =
  "h-[52px] w-full rounded-[10px] border border-zinc-300 bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 font-normal focus:outline-none focus:border-zinc-600 autofill:shadow-[0_0_0_1000px_white_inset]";

export default function Forget() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgetPassword = (e) => {
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

    setLoading(true);
    dispatch(forgetPassword(email.trim()))
      .then((res) => {
        if (res.payload?.status) {
          toast.success(res.payload.message);
          navigate("/send-message");
        } else {
          toast.error(res.payload?.message || "Something went wrong");
        }
      })
      .finally(() => setLoading(false));
  };

  return (
    <MainLayout hideHeader hideFooter hideMobileMenu contentClassName="!min-h-screen">
      <div className="flex min-h-[calc(100vh-32px)] flex-col pt-0 pb-0">
        {/* Top: Logo with exact 20px margin from top */}
        <div className="w-full max-w-xl mx-auto px-2 mt-[20px]">
          <Link to="/" className="inline-flex items-center gap-3 select-none" aria-label="Skillslide home">
            {/* S Orange Icon Badge */}
            <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[10px] bg-[#FA4602]">
              <span className="font-['Inter'] text-[28px] font-bold italic text-white leading-none">
                S
              </span>
            </div>

            {/* Skill (italic) + Slide (simple) */}
            <span className="font-['Inter'] text-[28px] font-black tracking-tight text-[#FA4602] leading-none">
              <span className="italic">Skill</span>
              <span className="not-italic">Slide</span>
            </span>
          </Link>
        </div>

        {/* Center: Centered between Logo and Bottom of page */}
        <div className="flex w-full flex-1 flex-col items-center justify-center py-4">
          <form
            onSubmit={handleForgetPassword}
            className="flex w-full max-w-xl flex-col gap-6 px-2 text-left text-sm text-[#000000]"
          >
            <div className="flex items-center justify-between gap-4 rounded-[20px] bg-[#F4F4F4] px-5 py-[16px] h-[68px] w-full">
              <div className="flex flex-col justify-center gap-[4px] text-left flex-1 min-w-0">
                <label className="text-[14px] font-normal text-black select-none">
                  Forgot Password
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  aria-label="Enter your email"
                  autoFocus
                  className="w-full text-[14px] font-normal text-zinc-900 bg-transparent outline-none focus:outline-none focus:ring-0 p-0 placeholder:text-zinc-500"
                />
              </div>
              <Mail className="h-5 w-5 text-black shrink-0" />
            </div>

            <div className="flex flex-col items-start gap-3">
              <button
                type="submit"
                disabled={loading}
                className="block w-fit rounded-full bg-[#FA4602] hover:bg-[#e03e02] px-12 py-[12px] text-center text-[16px] font-medium text-white transition-all duration-200 disabled:opacity-60"
              >
                {loading ? "Sending..." : "Continue"}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => navigate("/login")}
                className="block w-fit rounded-full bg-black px-12 py-[12px] text-center text-[16px] font-medium text-white transition-all duration-200 disabled:opacity-60"
              >
                Go back
              </button>
            </div>

            <div className="h-px w-full bg-gray-200" />

            <p className="text-[16px]">
              Remember your password?{" "}
              <Link to="/login" className="font-medium underline underline-offset-2">
                Log in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
