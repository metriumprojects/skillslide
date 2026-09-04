import logoBadge from "../assets/logo-badge.svg";

export default function LogoIcon({ className = "h-[46px] w-[46px]" }) {
  return (
    <img
      src={logoBadge}
      alt="SkillSlide Logo"
      className={`shrink-0 object-contain ${className}`}
    />
  );
}
