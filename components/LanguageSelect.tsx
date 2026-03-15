// "use client";

// import { useLanguage } from "@/components/LanguageProvider";
// import { AppLanguage, languageOptions } from "@/lib/language";

// const labels: Record<AppLanguage, string> = {
//   English: "English",
//   Hindi: "हिंदी",
//   Marathi: "मराठी",
// };

// export default function LanguageSelect({ className = "" }: { className?: string }) {
//   const { language, setLanguage } = useLanguage();

//   return (
//     <select
//       value={language}
//       onChange={(event) => setLanguage(event.target.value as AppLanguage)}
//       className={`rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 ${className}`}
//       aria-label="Select language"
//     >
//       {languageOptions.map((option) => (
//         <option key={option} value={option}>
//           {labels[option]}
//         </option>
//       ))}
//     </select>
//   );
// }


"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { AppLanguage } from "@/lib/language"; // languageOptions hata diya yahan se

const labels: Record<AppLanguage, string> = {
  English: "English",
  Hindi: "हिंदी",
  Marathi: "मराठी",
};

// Yahan define kar diya
const options: AppLanguage[] = ["English", "Hindi", "Marathi"];

export default function LanguageSelect({ className = "" }: { className?: string }) {
  const { language, setLanguage } = useLanguage();

  return (
    <select
      value={language}
      onChange={(event) => setLanguage(event.target.value as AppLanguage)}
      className={`rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 ${className}`}
      aria-label="Select language"
    >
      {/* Ab ye crash nahi hoga kyunki 'options' undefined nahi hai */}
      {options.map((option) => (
        <option key={option} value={option}>
          {labels[option]}
        </option>
      ))}
    </select>
  );
}