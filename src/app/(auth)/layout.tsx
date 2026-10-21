import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import logoPrimeCapital from "@/assets/logoprimecaptial.png";
import Grainient from "@/components/ui/Grainient";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh bg-canvas">
      {/* Left panel: animated Grainient background, desktop only */}
      <div className="relative hidden min-h-dvh w-1/2 flex-col justify-end overflow-hidden lg:flex">
        <div className="absolute inset-0">
          <Grainient
            color1="#000000"
            color2="#3B82F6"
            color3="#94a3b8"
            timeSpeed={0.25}
            colorBalance={0}
            warpStrength={1}
            warpFrequency={5}
            warpSpeed={2}
            warpAmplitude={50}
            blendAngle={0}
            blendSoftness={0.05}
            rotationAmount={500}
            noiseScale={2}
            grainAmount={0.1}
            grainScale={2}
            grainAnimated={false}
            contrast={1.5}
            gamma={1}
            saturation={1}
            centerX={0}
            centerY={0}
            zoom={0.9}
          />
        </div>

        <div className="relative z-10 bg-linear-to-t from-black/70 via-black/30 to-transparent px-10 py-12">
          <h2 className="mb-3 text-[28px] leading-snug font-normal tracking-[-0.01em] text-white/90">
            Track <strong className="font-bold text-white">smarter investments</strong>
            <br />
            with Prime Capital
          </h2>
          <p className="max-w-[420px] text-sm leading-relaxed text-white/70">
            Manage your portfolio, analyze performance, and make data-driven
            decisions with our professional ledger platform.
          </p>
        </div>
      </div>

      {/* Right panel: form */}
      <div className="relative flex min-h-dvh w-full items-center justify-center px-6 pt-20 pb-10 lg:w-1/2 lg:py-10">
        <Link
          href="/"
          className="absolute top-6 left-6 z-20 inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-raised/70 px-3.5 text-[13px] font-medium text-fg-2 backdrop-blur-sm transition-colors hover:border-line-strong hover:text-fg-1 lg:fixed"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>

        <div className="flex w-full max-w-[420px] flex-col items-center">
          <Image
            src={logoPrimeCapital}
            alt="Prime Capital Ledger"
            width={200}
            height={200}
            className="mb-2 opacity-95"
            priority
          />
          <div className="w-full">{children}</div>
        </div>
      </div>
    </div>
  );
}
