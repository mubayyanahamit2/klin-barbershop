import Link from "next/link";

export function Logo({
  light = false,
  hideWordmark = false,
  className = "",
}: {
  light?: boolean;
  hideWordmark?: boolean;
  className?: string;
}) {
  return (
    <Link
      href="/"
      aria-label="КЛИН — на главную"
      className={`group inline-flex items-center gap-3 ${className}`}
    >
      <span
        className={`relative grid size-9 shrink-0 place-items-center overflow-hidden ${
          light ? "bg-paper text-ink" : "bg-ink text-paper"
        }`}
      >
        <span className="font-display text-[15px] font-extrabold leading-none">
          К
        </span>
        <span className="absolute -right-1 top-[-10%] h-[120%] w-[4px] rotate-[20deg] bg-accent transition-transform duration-300 group-hover:translate-x-[-5px]" />
        <span className="absolute -right-3 top-[-10%] h-[120%] w-[2px] rotate-[20deg] bg-accent/60 transition-transform duration-300 group-hover:translate-x-[-5px]" />
      </span>
      {!hideWordmark && (
        <span
          className={`font-display text-[17px] font-extrabold tracking-[-0.08em] ${
            light ? "text-paper" : "text-ink"
          }`}
        >
          КЛИН<span className="text-accent">.</span>
        </span>
      )}
    </Link>
  );
}
