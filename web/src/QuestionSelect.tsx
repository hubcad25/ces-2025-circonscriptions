import { type Question, QUESTIONS } from "./questions";

// Themes keep the order in which they first appear in QUESTIONS.
const THEMES = [...new Set(QUESTIONS.map((question) => question.theme))];

type Props = { value: Question; onChange: (question: Question) => void };

export default function QuestionSelect({ value, onChange }: Props) {
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
        <optgroup key={theme} label={theme}>
          {QUESTIONS.filter((question) => question.theme === theme).map((question) => (
            <option key={question.code} value={question.code}>
              {question.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
