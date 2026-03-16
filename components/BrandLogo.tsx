type BrandLogoProps = {
  className?: string;
  textClassName?: string;
  secondaryClassName?: string;
};

export default function BrandLogo({ className = "", textClassName = "", secondaryClassName = "text-slate-900" }: BrandLogoProps) {
  return (
    <span className={`inline-flex items-end leading-none select-none ${className}`.trim()}>
      <span className={`font-samarkan text-[#E91E63] ${textClassName}`.trim()}>nav</span>
      <span className={`font-samarkan -ml-0.5 ${secondaryClassName} ${textClassName}`.trim()}>gurukul</span>
    </span>
  );
}