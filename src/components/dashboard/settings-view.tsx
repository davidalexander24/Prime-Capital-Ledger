import { User, Shield, Database, LogOut } from "lucide-react";
import { LogoutButton } from "@/components/dashboard/logout-button";
import { BaseCurrencySelect } from "@/components/dashboard/base-currency-select";

function SettingsSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden surface-card">
      <div className="flex items-center gap-2 border-b border-line-soft px-4 py-4 sm:px-6">
        <Icon className="size-4 text-fg-4" strokeWidth={1.75} />
        <h2 className="text-sm font-semibold text-fg-1">{title}</h2>
      </div>
      <div className="divide-y divide-line-soft">{children}</div>
    </section>
  );
}

function SettingRow({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const Label = htmlFor ? "label" : "span";
  return (
    <div className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6">
      <div className="min-w-0">
        <Label htmlFor={htmlFor} className="text-[13px] text-fg-3">
          {label}
        </Label>
        {hint && <p className="mt-0.5 text-[12px] text-fg-4">{hint}</p>}
      </div>
      <div className="min-w-0 text-[13px] font-medium break-words text-fg-2 sm:text-right">{children}</div>
    </div>
  );
}

export interface SettingsViewProps {
  name: string | null | undefined;
  email: string | null | undefined;
  baseCurrency: string;
  isGoogleAuth: boolean;
  transactionCount: number;
  lastEntryLabel: string;
}

export function SettingsView({
  name,
  email,
  baseCurrency,
  isGoogleAuth,
  transactionCount,
  lastEntryLabel,
}: SettingsViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-fg-1">Settings</h1>
        <p className="mt-1 text-[13px] text-fg-4">Your profile, display currency and session.</p>
      </div>

      <div className="flex flex-col gap-5">
        <SettingsSection title="Profile" icon={User}>
          <SettingRow label="Display name">{name || "—"}</SettingRow>
          <SettingRow label="Email">{email || "—"}</SettingRow>
          <SettingRow
            label="Base currency"
            htmlFor="base-currency"
            hint="Totals, charts and analytics are converted to this currency."
          >
            <div className="flex sm:justify-end">
              <BaseCurrencySelect id="base-currency" initialValue={baseCurrency} />
            </div>
          </SettingRow>
          <SettingRow label="Time zone" hint="Import history times and the dashboard's last-updated date use this zone.">
            Asia/Jakarta (WIB, UTC+7)
          </SettingRow>
        </SettingsSection>

        <SettingsSection title="Sign-in" icon={Shield}>
          <SettingRow label="Method">{isGoogleAuth ? "Google account" : "Email and password"}</SettingRow>
        </SettingsSection>

        <SettingsSection title="Data" icon={Database}>
          <SettingRow label="Transactions">
            <span className="tabular-nums">
              {transactionCount.toLocaleString("en-US")} {transactionCount === 1 ? "entry" : "entries"}
            </span>
          </SettingRow>
          <SettingRow label="Last entry">{lastEntryLabel}</SettingRow>
        </SettingsSection>

        <SettingsSection title="Session" icon={LogOut}>
          <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <span className="text-[13px] break-all text-fg-3">
              Signed in as <span className="text-fg-2">{email}</span>
            </span>
            <LogoutButton />
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}
