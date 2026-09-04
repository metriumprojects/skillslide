import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
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
      <div className="flex min-h-[calc(100vh-32px)] flex-col pt-0 pb-0">
        {/* Top: Logo + 20px gap Congratulation + 20px gap subtitle */}
        <div className="w-full max-w-3xl mx-auto px-2 mt-[20px] shrink-0">
          <Link to="/" className="inline-flex items-center gap-3 select-none" aria-label="Skillslide home">
            {/* S Orange Icon Badge - Official SVG */}
            <LogoIcon className="h-[46px] w-[46px]" />

            {/* Skill (italic) + Slide (simple) */}
            <span className="font-['Roboto'] text-[28px] font-black tracking-tight text-[#FA4602] leading-none">
              <span className="italic">Skill</span>
              <span className="not-italic">Slide</span>
            </span>
          </Link>

          {/* 20px gap: Congratulations heading */}
          <h1 className="mt-[20px] text-[24px] sm:text-[28px] font-normal leading-snug text-black">
            <span className="inline-flex items-center gap-2.5">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0"
                aria-hidden="true"
              >
                <path
                  d="M12 23C14.4477 23 16.3465 22.8672 17.8271 22.5381C19.2964 22.2115 20.2925 21.7056 20.999 20.999C21.7056 20.2925 22.2115 19.2964 22.5381 17.8271C22.8672 16.3465 23 14.4477 23 12C23 9.55232 22.8672 7.65353 22.5381 6.17285C22.2115 4.70364 21.7056 3.70752 20.999 3.00098C20.2925 2.29443 19.2964 1.78846 17.8271 1.46191C16.3465 1.13284 14.4477 1 12 1C9.55232 1 7.65353 1.13284 6.17285 1.46191C4.70364 1.78846 3.70752 2.29443 3.00098 3.00098C2.29443 3.70752 1.78846 4.70364 1.46191 6.17285C1.13284 7.65353 1 9.55232 1 12C1 14.4477 1.13284 16.3465 1.46191 17.8271C1.78846 19.2964 2.29443 20.2925 3.00098 20.999C3.70752 21.7056 4.70364 22.2115 6.17285 22.5381C7.65353 22.8672 9.55232 23 12 23Z"
                  stroke="black"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 9L11 14"
                  stroke="black"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 12L11 14"
                  stroke="black"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Congratulations!</span>
            </span>
            <br />
            <br />
            Your teacher profile is complete, and you’re all set to create your first lesson and start sharing your knowledge on Skillslide.
          </h1>
        </div>

        {/* Center: Remaining elements centered between the heading bottom and page bottom */}
        <div className="my-auto flex w-full flex-1 flex-col items-center justify-center py-6">
          <div className="w-full max-w-3xl space-y-6 px-2">
            <div className="flex flex-col items-start gap-3">
              <button
                type="button"
                onClick={() => navigate("/create-lesson")}
                className="inline-flex items-center rounded-full bg-[#FA4602] hover:bg-[#e03e02] px-6 py-3 text-sm font-medium text-white transition-colors"
              >
                Create your first lesson
              </button>

              <button
                type="button"
                onClick={() => navigate("/withdraw-request")}
                className="inline-flex items-center rounded-full bg-black hover:bg-neutral-800 px-6 py-3 text-sm font-medium text-white transition-colors"
              >
                Add your payment information
              </button>
            </div>

            <div className="h-px w-full bg-gray-200" />

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
