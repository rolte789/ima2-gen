type ProviderStatusBadgeProps = {
  ok: boolean;
  label: string;
};

export function ProviderStatusBadge({ ok, label }: ProviderStatusBadgeProps) {
  return (
    <span className={`provider-status-badge${ok ? " provider-status-badge--ok" : " provider-status-badge--bad"}`}>
      <span className={`status-dot ${ok ? "status-dot--ok" : "status-dot--bad"}`} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
