import { useEffect, useRef, useState } from "react";
import { loadRidingNames, type RidingName } from "./data";
import { normalize, useSlashFocus } from "./filters";
import { useLang } from "./i18n";

const MAX_MATCHES = 8;

// Typing filters the riding names; the arrow keys move through the matches, Enter opens the
// highlighted one and Escape clears the box.
export default function RidingSearch() {
  const { t } = useLang();
  const input = useRef<HTMLInputElement>(null);
  const [ridings, setRidings] = useState<RidingName[]>([]);
  const [search, setSearch] = useState("");
  // Position of the highlighted match, moved with the arrow keys.
  const [active, setActive] = useState(0);
  useSlashFocus(input);

  useEffect(() => {
    loadRidingNames().then((names) => setRidings([...names.values()]));
  }, []);

  const matches =
    search === ""
      ? []
      : ridings
          .filter((riding) => normalize(riding.fed23_name).includes(normalize(search)))
          .slice(0, MAX_MATCHES);

  function open(riding: RidingName) {
    setSearch("");
    setActive(0);
    input.current?.blur();
    window.location.hash = `#/riding/${riding.fed23}`;
  }

  return (
    <div className="riding-search">
      <input
        ref={input}
        type="search"
        placeholder={t("Go to another riding (press /)", "Aller à une autre circonscription (appuyez sur /)")}
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setActive(0);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActive(Math.min(active + 1, matches.length - 1));
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive(Math.max(active - 1, 0));
          }
          if (event.key === "Enter" && matches.length > 0) open(matches[active]);
          if (event.key === "Escape") {
            setSearch("");
            event.currentTarget.blur();
          }
        }}
      />
      {matches.length > 0 && (
        <ul>
          {matches.map((riding, index) => (
            <li key={riding.fed23}>
              <button aria-selected={index === active} onClick={() => open(riding)}>
                {riding.fed23_name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
