"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import logoPrimeCapital from "@/assets/logoprimecaptial.png";
import Grainient from "@/components/ui/Grainient";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  usePathname();

  return (
    <div className="auth-layout">
      {/* ── Left Panel: Animated Grainient Background ── */}
      <div className="auth-left-panel">
        <div className="auth-grainient-wrapper">
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

        {/* Bottom tagline */}
        <div className="auth-tagline">
          <h2 className="auth-tagline-heading">
            Track <strong>smarter investments</strong>
            <br />
            with Prime Capital
          </h2>
          <p className="auth-tagline-sub">
            Manage your portfolio, analyze performance, and make data-driven
            decisions with our professional ledger platform.
          </p>
        </div>
      </div>

      {/* ── Right Panel: Form ── */}
      <div className="auth-right-panel">
        <div className="auth-right-inner">
          {/* Logo */}
          <div className="auth-logo-wrapper">
            <Image
              src={logoPrimeCapital}
              alt="Prime Capital Logo"
              width={200}
              height={200}
              className="auth-logo-image"
              priority
            />
          </div>

          {/* Form content (login or register page) */}
          <div className="auth-form-container">{children}</div>

          {/* Footer */}
          <p className="auth-footer">
            Powered by <strong>Prime Capital</strong>
          </p>
        </div>
      </div>

      <style jsx global>{`
        /* ── Auth Layout Grid ── */
        .auth-layout {
          display: flex;
          min-height: 100vh;
          background: oklch(0.08 0.005 260);
        }

        /* ── Left Panel ── */
        .auth-left-panel {
          position: relative;
          display: none;
          flex-direction: column;
          justify-content: flex-end;
          width: 50%;
          min-height: 100vh;
          overflow: hidden;

        }

        @media (min-width: 1024px) {
          .auth-left-panel {
            display: flex;
          }
        }

        .auth-grainient-wrapper {
          position: absolute;
          inset: 0;
          z-index: 0;
        }



        /* Tagline at the bottom of left panel */
        .auth-tagline {
          position: relative;
          z-index: 10;
          padding: 48px 40px;
          background: linear-gradient(
            to top,
            rgba(0, 0, 0, 0.7) 0%,
            rgba(0, 0, 0, 0.3) 60%,
            transparent 100%
          );
        }

        .auth-tagline-heading {
          font-size: 28px;
          font-weight: 400;
          line-height: 1.35;
          color: rgba(255, 255, 255, 0.9);
          margin: 0 0 12px 0;
          letter-spacing: -0.01em;
        }

        .auth-tagline-heading strong {
          font-weight: 700;
          color: #fff;
        }

        .auth-tagline-sub {
          font-size: 14px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.5);
          margin: 0;
          max-width: 420px;
        }

        /* ── Right Panel ── */
        .auth-right-panel {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: 100vh;
          padding: 40px 24px;
          background: oklch(0.08 0.005 260);
        }

        @media (min-width: 1024px) {
          .auth-right-panel {
            width: 50%;
          }
        }

        .auth-right-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 420px;
        }

        /* Logo */
        .auth-logo-wrapper {
          margin-bottom: 8px;
        }

        .auth-logo-image {
          opacity: 0.95;
        }

        /* Form container */
        .auth-form-container {
          width: 100%;
        }

        /* Footer */
        .auth-footer {
          margin-top: 40px;
          font-size: 12px;
          color: oklch(0.4 0.005 260);
          text-align: center;
        }

        .auth-footer strong {
          font-weight: 600;
          color: oklch(0.5 0.005 260);
        }

        /* ── Shared Form Styles ── */
        .auth-heading {
          font-size: 24px;
          font-weight: 600;
          letter-spacing: -0.02em;
          color: oklch(0.93 0.005 260);
          margin: 0;
        }

        .auth-subheading {
          font-size: 14px;
          color: oklch(0.5 0.01 260);
          margin: 4px 0 0 0;
        }

        .auth-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 20px 0;
        }

        .auth-divider-line {
          flex: 1;
          height: 1px;
          background: oklch(0.18 0.005 260);
        }

        .auth-divider-text {
          font-size: 12px;
          color: oklch(0.4 0.005 260);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .auth-social-row {
          display: flex;
          gap: 12px;
        }

        .auth-social-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 42px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          color: oklch(0.85 0.005 260);
          background: oklch(0.12 0.005 260);
          border: 1px solid oklch(0.18 0.005 260);
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .auth-social-btn:hover {
          background: oklch(0.16 0.005 260);
          border-color: oklch(0.22 0.005 260);
        }

        .auth-social-icon {
          width: 18px;
          height: 18px;
        }

        .auth-field-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: oklch(0.65 0.005 260);
          margin-bottom: 6px;
        }

        .auth-field-label .auth-required {
          color: oklch(0.6 0.08 230);
        }

        .auth-field-wrapper {
          position: relative;
        }

        .auth-input {
          width: 100%;
          height: 42px;
          padding: 0 14px;
          border-radius: 10px;
          font-size: 14px;
          color: oklch(0.9 0.005 260);
          background: oklch(0.1 0.005 260);
          border: 1px solid oklch(0.18 0.005 260);
          outline: none;
          transition: all 0.2s ease;
        }

        .auth-input::placeholder {
          color: oklch(0.35 0.005 260);
        }

        .auth-input:focus {
          border-color: oklch(0.4 0.08 230);
          box-shadow: 0 0 0 3px oklch(0.4 0.08 230 / 0.15);
        }

        .auth-password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: oklch(0.45 0.005 260);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s ease;
        }

        .auth-password-toggle:hover {
          color: oklch(0.65 0.005 260);
        }

        .auth-checkbox-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
        }

        .auth-checkbox {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          border: 1px solid oklch(0.25 0.005 260);
          background: oklch(0.1 0.005 260);
          accent-color: oklch(0.6 0.08 230);
          cursor: pointer;
        }

        .auth-checkbox-label {
          font-size: 13px;
          color: oklch(0.55 0.005 260);
        }

        .auth-checkbox-label a {
          color: oklch(0.65 0.08 230);
          text-decoration: none;
          font-weight: 500;
        }

        .auth-checkbox-label a:hover {
          text-decoration: underline;
        }

        .auth-submit-btn {
          width: 100%;
          height: 44px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          background: oklch(0.45 0.12 230);
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 8px;
        }

        .auth-submit-btn:hover:not(:disabled) {
          background: oklch(0.5 0.14 230);
          box-shadow: 0 4px 20px oklch(0.45 0.12 230 / 0.35);
        }

        .auth-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auth-switch-text {
          text-align: center;
          font-size: 13px;
          color: oklch(0.5 0.01 260);
          margin-top: 20px;
        }

        .auth-switch-text a {
          color: oklch(0.7 0.08 230);
          font-weight: 600;
          text-decoration: none;
        }

        .auth-switch-text a:hover {
          text-decoration: underline;
        }

        .auth-error-box {
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          color: oklch(0.7 0.15 25);
          background: oklch(0.15 0.05 25);
          border: 1px solid oklch(0.25 0.08 25);
          text-align: center;
          margin-bottom: 4px;
        }

        .auth-forgot-link {
          font-size: 12px;
          font-weight: 500;
          color: oklch(0.55 0.08 230);
          text-decoration: none;
          margin-left: auto;
        }

        .auth-forgot-link:hover {
          text-decoration: underline;
          color: oklch(0.65 0.08 230);
        }

        .auth-fields-row {
          display: flex;
          gap: 12px;
        }

        .auth-fields-row > .auth-field-group {
          flex: 1;
        }
      `}</style>
    </div>
  );
}
