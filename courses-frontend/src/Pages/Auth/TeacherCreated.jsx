import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ArrowRight, Check } from "lucide-react";
import MainLayout from "../../components/MainLayout";
import { becomeTeacher, getUser } from "../../redux/reducers/AuthReducer";

const LOGO_URL =
  "https://res.cloudinary.com/dinwxxnzm/image/upload/v1784044801/Logo_1_jldcf8.png";

export default function TeacherCreated() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleStudentProfile = () => {
    dispatch(becomeTeacher("user")).then(() => {
      dispatch(getUser());
      navigate("/profile");
    });
  };

  return (
    <MainLayout hideHeader hideFooter hideMobileMenu contentClassName="!min-h-screen">
      <div className="mx-auto w-full max-w-3xl space-y-6 px-2 py-10">
        <Link to="/" className="inline-flex" aria-label="Skillslide home">
          <img src={LOGO_URL} alt="Skillslide" className="h-11 w-auto object-contain" />
        </Link>

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
            className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm text-white"
          >
            Create a lesson
            <ArrowRight size={16} />
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
    </MainLayout>
  );
}
