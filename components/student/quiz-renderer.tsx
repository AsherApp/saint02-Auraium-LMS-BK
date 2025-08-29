"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"

export type QuizQuestion = { id: string; question: string; options: string[]; correctIndex?: number }

export function QuizRenderer({
  questions = [],
  onComplete = () => {},
}: {
  questions?: QuizQuestion[]
  onComplete?: (score: number, total: number) => void
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)

  const total = questions.length
  const score = useMemo(() => {
    return questions.reduce((acc, q) => (answers[q.id] === q.correctIndex ? acc + 1 : acc), 0)
  }, [questions, answers])

  function select(qid: string, idx: number) {
    if (submitted) return
    setAnswers((a) => ({ ...a, [qid]: idx }))
  }

  function submit() {
    setSubmitted(true)
    onComplete(score, total)
  }

  if (!questions.length) {
    return <div className="text-slate-300 text-sm">No quiz questions have been added yet.</div>
  }

  return (
    <div className="space-y-4">
      {questions.map((q, idx) => {
        const selected = answers[q.id]
        const isCorrect = submitted && selected === q.correctIndex
        return (
          <div key={q.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="text-white font-medium">
              Q{idx + 1}. {q.question}
            </div>
            <div className="mt-2 grid gap-2">
              {q.options.map((opt, oIdx) => {
                const chosen = selected === oIdx
                const correct = submitted && q.correctIndex === oIdx
                return (
                  <button
                    key={oIdx}
                    onClick={() => select(q.id, oIdx)}
                    className={`text-left rounded-md border px-3 py-2 ${
                      chosen ? "border-blue-400 bg-blue-600/20 text-white" : "border-white/10 bg-white/5 text-slate-200"
                    } ${submitted ? (correct ? "border-emerald-400" : chosen ? "opacity-70" : "") : ""}`}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
            {submitted ? (
              <div className={`mt-2 text-sm ${isCorrect ? "text-emerald-300" : "text-rose-300"}`}>
                {isCorrect ? "Correct" : "Incorrect"}
              </div>
            ) : null}
          </div>
        )
      })}

      <div className="flex items-center justify-between">
        {submitted ? (
          <div className="text-slate-300 text-sm">
            Score: {score} / {total}
          </div>
        ) : (
          <div className="text-slate-400 text-sm">Make selections for each question.</div>
        )}
        {!submitted && (
          <Button className="bg-blue-600/80 hover:bg-blue-600 text-white" onClick={submit}>
            Submit
          </Button>
        )}
      </div>
    </div>
  )
}
