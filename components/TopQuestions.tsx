interface TopQuestionsProps {
  questions: string[];
}

export default function TopQuestions({ questions }: TopQuestionsProps) {
  if (questions.length === 0) {
    return null;
  }

  return (
    <ol className="flex flex-col gap-3">
      {questions.map((q, i) => (
        <li
          key={i}
          className="flex items-start gap-4 rounded-xl border border-border bg-surface px-5 py-4"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent-strong">
            {i + 1}
          </span>
          <span className="pt-0.5 text-base leading-relaxed text-foreground">{q}</span>
        </li>
      ))}
    </ol>
  );
}
