type BrandLogoProps = {
  className?: string;
};

export default function BrandLogo({ className = "" }: BrandLogoProps) {
  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`.trim()}>
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#E91E63] to-[#FF8A65] text-sm font-black text-white shadow-[0_8px_22px_rgba(233,30,99,0.32)]">
        M
      </span>
      <span className="leading-none">
        <span className="block text-lg font-black tracking-tight text-slate-900">Mathzy</span>
        <span className="block text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">Math Practice</span>
      </span>
    </div>
  );
}