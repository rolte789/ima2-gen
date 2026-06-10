import type { ProviderIdentity } from "../../lib/providerIdentity";
import type { CSSProperties } from "react";
import { ProviderStatusBadge } from "./ProviderStatusBadge";

type ProviderCardProps = {
  identity: ProviderIdentity;
  selected: boolean;
  ok: boolean;
  disabled?: boolean;
  statusLabel: string;
  title: string;
  ariaLabel: string;
  onClick: () => void;
};

export function ProviderCard({
  identity,
  selected,
  ok,
  disabled,
  statusLabel,
  title,
  ariaLabel,
  onClick,
}: ProviderCardProps) {
  const className = [
    "provider-card",
    `provider-card--${identity.family}`,
    selected ? "is-selected" : "",
    disabled ? "is-disabled" : "",
  ].filter(Boolean).join(" ");

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      aria-pressed={selected}
      style={{ "--provider-accent": `var(${identity.accentVar})` } as CSSProperties}
    >
      <span className="provider-card__mark" aria-hidden="true">{identity.product.slice(0, 1)}</span>
      <span className="provider-card__body">
        <span className="provider-card__topline">
          <span className="provider-card__product">{identity.product}</span>
          <span className="provider-card__method">{identity.methodLabel}</span>
        </span>
        <span className="provider-card__detail">{identity.detailLabel}</span>
      </span>
      <ProviderStatusBadge ok={ok} label={statusLabel} />
    </button>
  );
}
