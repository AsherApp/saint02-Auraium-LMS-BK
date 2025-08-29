"use client"

import type React from "react"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { LessonCard } from "./lesson-card"

export type ModuleData = {
  id: string
  title: string
  lessons: { id: string; title: string; type: "video" | "quiz" | "file" | "discussion" | "poll" }[]
}

export function ModuleAccordion({
  modules = [],
  cta,
}: {
  modules?: ModuleData[]
  cta?: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <Accordion type="single" collapsible className="w-full">
        {modules.map((m) => (
          <AccordionItem key={m.id} value={m.id} className="border-white/10">
            <AccordionTrigger className="text-white">{m.title}</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {m.lessons.length ? (
                  m.lessons.map((l) => <LessonCard key={l.id} title={l.title} type={l.type} />)
                ) : (
                  <div className="text-sm text-slate-400">No lessons yet.</div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      {cta ? <div className="pt-2">{cta}</div> : null}
    </div>
  )
}
