import { type RefObject, useEffect, useRef } from "react";

// West to east, then the territories, as in most Canadian tables.
const PROVINCES = ["BC", "AB", "SK", "MB", "ON", "QC", "NB", "NS", "PE", "NL", "YT", "NT", "NU"];

// Lets "montreal" match "Montréal" and "quebec" match "Québec".
export const normalize = (text: string) =>
  text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export type Filter = { province: string; search: string };

type Located = { fed23_name: string; province: string };

export function matches(riding: Located, { province, search }: Filter): boolean {
  return (
    (province === "" || riding.province === province) &&
    normalize(riding.fed23_name).includes(normalize(search))
  );
}

// "/" jumps to the search box, as on GitHub; it is ignored while typing in a field.
export function useSlashFocus(input: RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isTyping = event.target instanceof HTMLInputElement;
      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        input.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [input]);
}

type Props = { filter: Filter; onChange: (filter: Filter) => void };

export default function FilterControls({ filter, onChange }: Props) {
  const searchInput = useRef<HTMLInputElement>(null);
  useSlashFocus(searchInput);

  return (
    <>
      <select
        value={filter.province}
        onChange={(event) => onChange({ ...filter, province: event.target.value })}
      >
        <option value="">All provinces</option>
        {PROVINCES.map((code) => (
          <option key={code}>{code}</option>
        ))}
      </select>
      <input
        ref={searchInput}
        type="search"
        placeholder="Search riding (press /)"
        value={filter.search}
        onChange={(event) => onChange({ ...filter, search: event.target.value })}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            onChange({ ...filter, search: "" });
            event.currentTarget.blur();
          }
        }}
      />
    </>
  );
}
