import Image from "next/image";

type BrandLogoProps = {
  className?: string;
};

export default function BrandLogo({ className = "" }: BrandLogoProps) {
  return (
    <div className={`inline-flex items-center select-none ${className}`.trim()}>
      <Image
        src="/ng-logo-horizontal.avif"
        alt="NavGurukul"
        width={140}
        height={40}
        priority
        className="h-9 w-auto object-contain"
      />
    </div>
  );
}