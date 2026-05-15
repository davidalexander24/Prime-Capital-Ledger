import Image from "next/image";
import logoPrimeCapital from "@/assets/logoprimecaptial.png";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[oklch(0.03_0.005_260)]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[oklch(0.1_0.05_230)] via-[oklch(0.03_0.005_260)] to-[oklch(0.03_0.005_260)] opacity-50" />
      <div className="z-10 flex w-full max-w-md flex-col items-center gap-8 px-4">
        <div className="flex justify-center">
          <Image
            src={logoPrimeCapital}
            alt="Prime Capital Logo"
            width={240}
            height={240}
            className="scale-[1.1]"
            priority
          />
        </div>
        <div className="w-full rounded-2xl border border-[oklch(0.14_0.005_260)] bg-[oklch(0.05_0.005_260)]/80 p-8 shadow-2xl backdrop-blur-xl">
          {children}
        </div>
      </div>
    </div>
  );
}
