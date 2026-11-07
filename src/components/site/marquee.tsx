const services = [
  "Мужские стрижки",
  "Фейды",
  "Оформление бороды",
  "Опасная бритва",
  "Камуфляж седины",
  "Детские стрижки",
  "Укладка",
];

export function Marquee({
  dark = false,
  accent = true,
}: {
  dark?: boolean;
  accent?: boolean;
}) {
  const items = [...services, ...services];

  return (
    <div
      className={`overflow-hidden border-y ${
        accent
          ? "border-accent bg-accent text-ink"
          : dark
            ? "border-paper/15 bg-ink text-paper"
            : "border-ink/15 bg-paper-deep text-ink"
      }`}
    >
      <div className="marquee py-2.5">
        {items.map((service, index) => (
          <span
            key={`${service}-${index}`}
            className="flex shrink-0 items-center gap-7 pr-7 text-[11px] font-extrabold uppercase tracking-[0.18em]"
          >
            {service}
            <span className="text-[15px] font-light opacity-60">+</span>
          </span>
        ))}
      </div>
    </div>
  );
}
