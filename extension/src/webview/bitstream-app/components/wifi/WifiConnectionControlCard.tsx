/*******************************************************************************
 * File Name        : WifiConnectionControlCard.tsx
 *
 * Description      : Connect / disconnect form for the Wi‑Fi panel (user-facing).
 *
 * Author           : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version          : 1.2
 * Target           : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { KeyRound, Link2, LoaderCircle, Shield, Unplug, Wifi } from "lucide-react";
import { formatWcmSecurityHex, WCM_SECURITY_PRESETS } from "../../../../bitstream/wifi/wifi-wcm-security";
import { TRNButton, TRNFormField, TRNHintText, TRNInput, TRNInputGroup, TRNSelect } from "@/ui/TRN";
import {
  BS2_WIFI_CONNECT_PASSWORD_MAX_LEN,
  BS2_WIFI_CONNECT_SSID_MAX_LEN,
  formatWifiUserBusyMessage,
  resolveWifiUserBusyToken,
} from "./wifi-panel-utils";

const SECURITY_SELECT_BUTTON =
  "h-8 w-full border-zinc-700/80 bg-zinc-900/80 px-2 text-xs text-zinc-100 shadow-none backdrop-blur-none";

const SECURITY_CUSTOM_INPUT =
  "mt-1 w-full rounded-md border border-zinc-700/80 bg-zinc-900/80 px-2 py-1.5 text-xs text-zinc-100 outline-none ring-0 focus-visible:ring-0";

export function WifiConnectionControlCard(props: {
  blocked: boolean;
  busy: string | null;
  ssid: string;
  password: string;
  securityPresetKey: string;
  securityCustomText: string;
  resolvedSecurityUint32: number;
  onSsidChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSecurityPresetChange: (value: string) => void;
  onSecurityCustomTextChange: (value: string) => void;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const {
    blocked,
    busy,
    ssid,
    password,
    securityPresetKey,
    securityCustomText,
    resolvedSecurityUint32,
    onSsidChange,
    onPasswordChange,
    onSecurityPresetChange,
    onSecurityCustomTextChange,
    onConnect,
    onDisconnect,
  } = props;

  const busyToken = resolveWifiUserBusyToken(busy);
  const busyLabel = formatWifiUserBusyMessage(busyToken, ssid.trim());
  const ssidTrim = ssid.trim();

  const securityOptions = WCM_SECURITY_PRESETS.map((p) => ({
    value: p.key,
    label: p.label,
  }));

  return (
    <div className="space-y-3">
      {busyToken != null ? (
        <div className="flex items-center gap-2 px-0.5 py-0.5 text-xs text-sky-100/95">
          <LoaderCircle className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
          <span>{busyLabel}</span>
        </div>
      ) : null}

      <TRNInputGroup>
        <TRNInput
          prefixIcon={Wifi}
          value={ssid}
          onChange={(e) => onSsidChange(e.target.value.slice(0, BS2_WIFI_CONNECT_SSID_MAX_LEN))}
          disabled={blocked}
          autoComplete="off"
          spellCheck={false}
          maxLength={BS2_WIFI_CONNECT_SSID_MAX_LEN}
          placeholder="Your Wi‑Fi name"
          aria-label="Network name"
        />
        <TRNInput
          prefixIcon={KeyRound}
          type="password"
          value={password}
          onChange={(e) =>
            onPasswordChange(e.target.value.slice(0, BS2_WIFI_CONNECT_PASSWORD_MAX_LEN))
          }
          disabled={blocked}
          autoComplete="off"
          maxLength={BS2_WIFI_CONNECT_PASSWORD_MAX_LEN}
          placeholder="Password (optional for open Wi‑Fi)"
          aria-label="Password"
        />
      </TRNInputGroup>

      <TRNFormField label="Security type" layout="stacked">
        <TRNSelect
          ariaLabel="Wi-Fi security"
          size="sm"
          value={securityPresetKey}
          options={securityOptions}
          disabled={blocked}
          onValueChange={onSecurityPresetChange}
          leadingIcon={<Shield className="h-4 w-4 text-zinc-500" aria-hidden />}
          showSelectedIconInTrigger={false}
          buttonClassName={SECURITY_SELECT_BUTTON}
          panelClassName="border border-zinc-700/70"
        />
        {securityPresetKey === "custom" ? (
          <input
            value={securityCustomText}
            onChange={(e) => onSecurityCustomTextChange(e.target.value)}
            disabled={blocked}
            placeholder="Advanced: security value"
            className={SECURITY_CUSTOM_INPUT}
            autoComplete="off"
            spellCheck={false}
          />
        ) : null}
        {securityPresetKey === "custom" ? (
          <TRNHintText tone="muted" className="mb-0 mt-1 text-[10px]">
            {formatWcmSecurityHex(resolvedSecurityUint32)}
          </TRNHintText>
        ) : null}
      </TRNFormField>

      <div className="grid grid-cols-2 gap-2">
        <TRNButton
          size="compact"
          className="gap-1.5 text-[11px]"
          prefixIcon={<Link2 className="h-3.5 w-3.5 text-emerald-300/90" aria-hidden />}
          onClick={onConnect}
          disabled={blocked || ssidTrim.length === 0}
        >
          Connect
        </TRNButton>
        <TRNButton
          size="compact"
          className="gap-1.5 text-[11px]"
          prefixIcon={<Unplug className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
          onClick={onDisconnect}
          disabled={blocked}
        >
          Disconnect
        </TRNButton>
      </div>

      <TRNHintText tone="muted" className="mb-0 text-[10px] leading-snug">
        Open the Networks tab to scan, then tap Use to fill the name here.
      </TRNHintText>
    </div>
  );
}
