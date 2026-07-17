export function OptionCard({
  selected,
  onClick,
  title,
  subtitle,
  swatch,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle?: string;
  swatch?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`hover-wiggle flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
        selected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"
      }`}
    >
      {swatch && (
        <span
          className="mt-1 inline-block h-4 w-4 shrink-0 rounded-full border border-border"
          style={{ backgroundColor: swatch }}
        />
      )}
      <span>
        <span className="block font-semibold text-foreground">{title}</span>
        {subtitle && <span className="mt-0.5 block text-sm text-muted-foreground">{subtitle}</span>}
      </span>
    </button>
  );
}
