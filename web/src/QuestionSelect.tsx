import { useLang } from "./i18n";
import { type Question, QUESTIONS } from "./questions";

// Themes keep the order in which they first appear in QUESTIONS.
const THEMES = [...new Map(QUESTIONS.map((question) => [question.theme.en, question.theme])).values()];

type Props = { value: Question; onChange: (question: Question) => void };

export default function QuestionSelect({ value, onChange }: Props) {
  const { lang } = useLang();
  return (
    <select
      className="question-select"
      aria-label="Question"
      value={value.code}
      onChange={(event) =>
        onChange(QUESTIONS.find((option) => option.code === event.target.value)!)
      }
    >
      {THEMES.map((theme) => (
        <optgroup key={theme.en} label={theme[lang]}>
          {QUESTIONS.filter((question) => question.theme.en === theme.en).map((question) => (
            <option key={question.code} value={question.code}>
              {question.label[lang]}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
