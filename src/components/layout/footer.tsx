import dayjs from "dayjs";

export default function Footer() {
  const currentYear = dayjs().year();
  const startYear = 2025;
  const yearText =
    currentYear > startYear ? `${startYear}–${currentYear}` : `${startYear}`;

  return (
    <div className="text-left text-muted-foreground text-xs leading-relaxed">
      <p>
        © {yearText} biarapa.com. Built with 🧡 by{" "}
        <a
          className="text-foreground underline underline-offset-2"
          href="https://github.com/clarifei"
          rel="noopener noreferrer"
          target="_blank"
        >
          clarifei
        </a>
        .
      </p>
      <p>biarapa.com is a free service provided by RING-00.</p>
    </div>
  );
}
