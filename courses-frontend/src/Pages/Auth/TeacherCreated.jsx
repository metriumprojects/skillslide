import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Check } from "lucide-react";
import MainLayout from "../../components/MainLayout";
import LogoIcon from "../../components/LogoIcon";
import { becomeTeacher, getUser } from "../../redux/reducers/AuthReducer";

export default function TeacherCreated() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleStudentProfile = () => {
    dispatch(becomeTeacher({ role: "user", resetSellerInfo: true })).then(() => {
      dispatch(getUser());
      navigate("/profile");
    });
  };

  return (
    <MainLayout hideHeader hideFooter hideMobileMenu contentClassName="!min-h-screen">
      <div className="flex min-h-[calc(100vh-32px)] flex-col pt-0 pb-5">
        {/* Top: Logo with exact 20px margin from top */}
        <div className="w-full max-w-3xl mx-auto px-2 mt-[20px]">
          <Link to="/" className="inline-flex items-center gap-3 select-none" aria-label="Skillslide home">
            {/* S Orange Icon Badge - Official SVG */}
            <LogoIcon className="h-[46px] w-[46px]" />

            {/* Skill (italic) + Slide (simple) */}
            <span className="font-['Roboto'] text-[28px] font-black tracking-tight text-[#FA4602] leading-none">
              <span className="italic">Skill</span>
              <span className="not-italic">Slide</span>
            </span>
          </Link>
        </div>

        {/* Center: Rest of the area centered between logo and page bottom */}
        <div className="my-auto flex w-full flex-1 flex-col items-center justify-center py-6">
          <div className="w-full max-w-3xl space-y-6 px-2">
            <div className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                <Check size={18} strokeWidth={3} />
              </span>
              <h1 className="text-[28px] font-semibold leading-tight text-black">
                Congratulation! You just created your teacher profile
              </h1>
            </div>

            <p className="text-[16px] text-gray-500">
              You can now create your first lesson and start teaching on Skillslide.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/create-lesson")}
                className="inline-flex items-center rounded-full bg-[#FA4602] hover:bg-[#e03e02] px-6 py-3 text-sm font-medium text-white transition-colors"
              >
                Create a lesson
              </button>
            </div>

            <div className="text-left text-base text-gray-700">
              <button
                type="button"
                onClick={handleStudentProfile}
                className="underline underline-offset-2 text-black"
              >
                Cancel and go back to student profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
