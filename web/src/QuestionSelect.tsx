import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { normalize } from "./filters";
import { useLang } from "./i18n";
import { type Question, QUESTIONS } from "./questions";

// Themes keep the order in which they first appear in QUESTIONS.
const THEMES = [...new Map(QUESTIONS.map((question) => [question.theme.en, question.theme])).values()];

type Props = { value: Question; onChange: (question: Question) => void };

// A native select cannot be styled once open, nor searched; this one can, with the keyboard
// too: arrows to move, Enter to choose, Escape to close.
export default function QuestionSelect({ value, onChange }: Props) {
  const { lang, t } = useLang();
  const [isOpen, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(0);
  const picker = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);

  const matching = QUESTIONS.filter((question) =>
    normalize(question.label[lang]).includes(normalize(search)),
  );

  function open() {
    setSearch("");
    setActive(QUESTIONS.indexOf(value));
    setOpen(true);
  }

  function choose(question: Question) {
    onChange(question);
    setOpen(false);
  }

  // A click anywhere else closes the menu.
  useEffect(() => {
    if (!isOpen) return;
    function onMouseDown(event: MouseEvent) {
      if (!picker.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [isOpen]);

  useEffect(() => {
    list.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [active, isOpen]);

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowDown") setActive((index) => Math.min(index + 1, matching.length - 1));
    else if (event.key === "ArrowUp") setActive((index) => Math.max(index - 1, 0));
    else if (event.key === "Enter" && matching[active]) choose(matching[active]);
    else if (event.key === "Escape") setOpen(false);
    else return;
    event.preventDefault();
  }

  return (
    <div className="question-picker" ref={picker}>
      <button
        className="question-select"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => (isOpen ? setOpen(false) : open())}
      >
        {value.label[lang]}
      </button>
      {isOpen && (
        <div className="question-menu" onKeyDown={onKeyDown}>
          <input
            type="search"
            autoFocus
            placeholder={t("Search questions", "Chercher une question")}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setActive(0);
            }}
          />
          <ul role="listbox" ref={list}>
            {THEMES.map((theme) => {
              const questions = matching.filter((question) => question.theme.en === theme.en);
              if (questions.length === 0) return null;
              return (
                <li key={theme.en}>
                  <div className="question-theme">{theme[lang]}</div>
                  <ul>
                    {questions.map((question) => (
                      <li
                        key={question.code}
                        role="option"
                        aria-selected={question.code === value.code}
                        data-active={matching[active] === question}
                        onMouseEnter={() => setActive(matching.indexOf(question))}
                        onClick={() => choose(question)}
                      >
                        {question.label[lang]}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
          {matching.length === 0 && (
            <p className="question-empty">{t("No question matches.", "Aucune question ne correspond.")}</p>
          )}
        </div>
      )}
    </div>
  );
}
