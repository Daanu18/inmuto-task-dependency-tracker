import { useState } from "react"

const priorityConfig = {
  1: { label: "Low", color: "bg-slate-400" },
  2: { label: "Medium-Low", color: "bg-blue-400" },
  3: { label: "Medium", color: "bg-yellow-400" },
  4: { label: "Medium-High", color: "bg-orange-400" },
  5: { label: "High", color: "bg-red-500" },
}

export function TaskForm({ onCreateTask, isLoading }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState(3)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (title.trim()) {
      await onCreateTask(title, description, priority)
      setTitle("")
      setDescription("")
      setPriority(3)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Create Task</h2>
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="title"
              className="text-sm font-medium text-slate-900"
            >
              Task Title
            </label>
            <input
              id="title"
              type="text"
              placeholder="Enter task title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="description"
              className="text-sm font-medium text-slate-900"
            >
              Description
            </label>
            <textarea
              id="description"
              placeholder="Enter task description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[80px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
            />
          </div>
          
          {/* Priority Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">
              Priority
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setPriority(level)}
                  className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${
                    priority === level
                      ? "border-slate-900 bg-slate-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${priorityConfig[level].color}`} />
                  <span className="text-xs text-slate-600">{level}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 text-center">
              {priorityConfig[priority].label} Priority
            </p>
          </div>
          <button
            type="submit"
            disabled={isLoading || !title.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Task
          </button>
        </form>
      </div>
    </div>
  )
}
