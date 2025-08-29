"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function PollRenderer({
  question = "Poll",
  options = [],
  onVote = () => {},
}: {
  question?: string
  options?: string[]
  onVote?: (optionIndex: number) => void
}) {
  const [voted, setVoted] = useState<number | null>(null)

  if (!options.length) {
    return <div className="text-slate-300 text-sm">No poll options have been added yet.</div>
  }

  return (
    <div className="space-y-4 w-full max-w-lg mx-auto p-4 bg-white/5 rounded-lg border border-white/10 shadow-md">
      <div className="text-white font-bold text-lg mb-2 text-center">{question}</div>
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full">
        {options.map((opt, i) => (
          <Button
            key={i}
            className={
              voted === i
                ? "bg-blue-600 text-white font-bold px-4 py-2 rounded-md shadow focus:outline-none focus:ring-2 focus:ring-blue-300"
                : "bg-white/10 hover:bg-white/20 text-white border border-white/15 px-4 py-2 rounded-md shadow focus:outline-none focus:ring-2 focus:ring-blue-300"
            }
            onClick={() => {
              setVoted(i)
              onVote(i)
            }}
            disabled={voted !== null}
            aria-label={`Vote for option: ${opt}`}
          >
            {opt}
          </Button>
        ))}
      </div>
      {voted !== null ? <div className="text-blue-400 text-base font-semibold text-center mt-3">Thanks for voting.</div> : null}
    </div>
  )
}
