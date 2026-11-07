const statusMap: Record<string, { label: string; className: string }> = {
  CONFIRMED: {
    label: "Подтверждена",
    className: "border-lime/25 bg-lime/10 text-lime",
  },
  DONE: {
    label: "Выполнена",
    className: "border-paper/15 bg-paper/[0.05] text-paper/45",
  },
  CANCELLED: {
    label: "Отменена",
    className: "border-accent/25 bg-accent/10 text-accent",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const value = statusMap[status] ?? {
    label: status,
    className: "border-paper/15 bg-paper/[0.05] text-paper/45",
  };

  return (
    <span
      className={`inline-flex h-6 items-center border px-2 text-[8px] font-extrabold uppercase tracking-[0.1em] ${value.className}`}
    >
      {value.label}
    </span>
  );
}

export function SourceBadge({ source }: { source: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-paper/35">
      <span
        className={`size-1.5 rounded-full ${
          source === "TELEGRAM" ? "bg-[#56a9df]" : "bg-paper/35"
        }`}
      />
      {source === "TELEGRAM" ? "Telegram" : "Сайт"}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center border border-dashed border-paper/15 px-6 py-10 text-center">
      <p className="font-display text-lg font-semibold tracking-[-0.04em] text-paper/70">
        {title}
      </p>
      <p className="mt-2 max-w-sm text-[11px] leading-5 text-paper/35">
        {description}
      </p>
      {children}
    </div>
  );
}
