import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Trash2, 
  Target,
  CheckCircle
} from "lucide-react"

interface StudyGoalsProps {
  goals: string[]
  onGoalsChange: (goals: string[]) => void
}

export function StudyGoals({ goals, onGoalsChange }: StudyGoalsProps) {
  const [newGoal, setNewGoal] = useState("")

  const addGoal = () => {
    if (newGoal.trim() && !goals.includes(newGoal.trim())) {
      onGoalsChange([...goals, newGoal.trim()])
      setNewGoal("")
    }
  }

  const removeGoal = (index: number) => {
    onGoalsChange(goals.filter((_, i) => i !== index))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addGoal()
    }
  }

  return (
    <div className="bg-white/5 rounded-lg border border-white/10 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-5 w-5 text-purple-400" />
        <h3 className="text-white font-medium">Study Goals</h3>
        <Badge 
          variant="outline" 
          className="bg-purple-500/20 text-purple-400 border-purple-500/30"
        >
          {goals.length}
        </Badge>
      </div>

      {/* Add New Goal */}
      <div className="flex gap-2 mb-4">
        <Input
          value={newGoal}
          onChange={(e) => setNewGoal(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Add a study goal..."
          className="bg-white/5 border-white/20 text-white placeholder:text-slate-400 focus:border-purple-500/50 focus:ring-purple-500/20 focus:ring-1 transition-all duration-200"
        />
        <Button
          onClick={addGoal}
          disabled={!newGoal.trim()}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Goals List */}
      <div className="space-y-2">
        {goals.length === 0 ? (
          <div className="text-center py-6 text-slate-400">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No study goals set yet</p>
            <p className="text-xs">Add goals to track your learning objectives</p>
          </div>
        ) : (
          goals.map((goal, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
            >
              <div className="flex items-center gap-3 flex-1">
                <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                <span className="text-white text-sm">{goal}</span>
              </div>
              <Button
                onClick={() => removeGoal(index)}
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      {goals.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="text-center">
            <p className="text-sm text-slate-400">
              {goals.length === 1 
                ? "1 goal set" 
                : `${goals.length} goals set`
              }
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Track your progress as you complete each goal
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
