import { useState, useEffect, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: string
}

type Filter = 'all' | 'active' | 'completed'
type Theme = 'light' | 'dark'

// ─── Storage keys ─────────────────────────────────────────────────────────────

const STORAGE_ITEMS = 'darktodo_items'
const STORAGE_THEME = 'darktodo_theme'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_ITEMS)
    if (!raw) return []
    return JSON.parse(raw) as Todo[]
  } catch (err) {
    console.error('Failed to load todos from localStorage', err)
    return []
  }
}

function saveTodos(todos: Todo[]): void {
  try {
    localStorage.setItem(STORAGE_ITEMS, JSON.stringify(todos))
  } catch (err) {
    console.error('Failed to save todos to localStorage', err)
  }
}

function loadTheme(): Theme {
  try {
    const raw = localStorage.getItem(STORAGE_THEME)
    if (raw === 'dark' || raw === 'light') return raw
    return 'light'
  } catch (err) {
    console.error('Failed to load theme from localStorage', err)
    return 'light'
  }
}

function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_THEME, theme)
  } catch (err) {
    console.error('Failed to save theme to localStorage', err)
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ filter }: { filter: Filter }) {
  const messages: Record<Filter, string> = {
    all: 'No todos yet — add one above!',
    active: 'No active todos — nice work!',
    completed: 'No completed todos yet.',
  }

  const emojis: Record<Filter, string> = {
    all: '📝',
    active: '🎉',
    completed: '✅',
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3" data-testid="empty-state">
      <span className="text-5xl">{emojis[filter]}</span>
      <p className="text-gray-400 dark:text-gray-500 text-sm text-center">
        {messages[filter]}
      </p>
    </div>
  )
}

// ─── Todo Item ────────────────────────────────────────────────────────────────

interface TodoItemProps {
  todo: Todo
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <div
      className="group flex items-center gap-3 px-4 py-3 rounded-xl
        bg-white dark:bg-[#16213e]
        border border-gray-100 dark:border-[#1e2d4a]
        shadow-sm hover:shadow-md dark:shadow-none
        transition-shadow duration-200"
      data-testid="todo-item"
    >
      {/* Checkbox */}
      <button
        type="button"
        role="checkbox"
        aria-checked={todo.completed}
        aria-label={`Mark "${todo.text}" as ${todo.completed ? 'incomplete' : 'complete'}`}
        onClick={() => onToggle(todo.id)}
        className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
          transition-colors duration-200 cursor-pointer
          ${todo.completed
            ? 'bg-indigo-500 border-indigo-500 dark:bg-[#6c63ff] dark:border-[#6c63ff]'
            : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-[#6c63ff]'
          }`}
        data-testid="todo-checkbox"
      >
        {todo.completed && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Text */}
      <span
        className={`flex-1 text-sm leading-relaxed transition-colors duration-200
          ${todo.completed
            ? 'line-through text-gray-400 dark:text-gray-600'
            : 'text-gray-700 dark:text-[#e8e8e8]'
          }`}
        data-testid="todo-text"
      >
        {todo.text}
      </span>

      {/* Delete */}
      <button
        type="button"
        aria-label={`Delete "${todo.text}"`}
        onClick={() => onDelete(todo.id)}
        className="flex-shrink-0 p-1.5 rounded-lg text-gray-300 dark:text-gray-600
          hover:text-red-500 dark:hover:text-red-400
          hover:bg-red-50 dark:hover:bg-red-900/20
          opacity-0 group-hover:opacity-100
          transition-all duration-200 cursor-pointer"
        data-testid="todo-delete"
      >
        <TrashIcon />
      </button>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos)
  const [theme, setTheme] = useState<Theme>(loadTheme)
  const [filter, setFilter] = useState<Filter>('all')
  const [inputValue, setInputValue] = useState('')

  // Apply dark class to <html> and persist theme
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    saveTheme(theme)
  }, [theme])

  // Persist todos on every change
  useEffect(() => {
    saveTodos(todos)
  }, [todos])

  // ── Actions ────────────────────────────────────────────────────────────────

  const addTodo = useCallback(() => {
    const text = inputValue.trim()
    if (!text) return
    const newTodo: Todo = {
      id: generateId(),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
    }
    setTodos(prev => [newTodo, ...prev])
    setInputValue('')
  }, [inputValue])

  const toggleTodo = useCallback((id: string) => {
    setTodos(prev =>
      prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    )
  }, [])

  const deleteTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id))
  }, [])

  const clearCompleted = useCallback(() => {
    setTodos(prev => prev.filter(t => !t.completed))
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') addTodo()
  }

  // ── Derived state ──────────────────────────────────────────────────────────

  const filteredTodos = todos.filter(t => {
    if (filter === 'active') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  const activeCount = todos.filter(t => !t.completed).length
  const completedCount = todos.filter(t => t.completed).length

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen bg-[#fafafa] dark:bg-[#0f0f23] transition-colors duration-300"
      data-testid="app-container"
      data-theme={theme}
    >
      <div className="max-w-[600px] mx-auto px-4 py-10">

        {/* ── Header ── */}
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-[#e8e8e8]">
            DarkTodo
          </h1>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2.5 rounded-xl
              text-gray-500 dark:text-gray-300
              bg-white dark:bg-[#16213e]
              border border-gray-200 dark:border-[#1e2d4a]
              hover:bg-gray-50 dark:hover:bg-[#1e2d4a]
              shadow-sm transition-all duration-200 cursor-pointer"
            data-testid="theme-toggle"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </header>

        {/* ── Input ── */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a new todo..."
            aria-label="New todo input"
            className="flex-1 px-4 py-3 rounded-xl text-sm
              bg-white dark:bg-[#16213e]
              text-gray-700 dark:text-[#e8e8e8]
              placeholder-gray-400 dark:placeholder-gray-500
              border border-gray-200 dark:border-[#1e2d4a]
              outline-none focus:border-indigo-400 dark:focus:border-[#6c63ff]
              focus:ring-2 focus:ring-indigo-100 dark:focus:ring-[#6c63ff]/20
              transition-all duration-200 shadow-sm"
            data-testid="todo-input"
          />
          <button
            type="button"
            onClick={addTodo}
            className="px-5 py-3 rounded-xl text-sm font-medium
              bg-indigo-500 dark:bg-[#6c63ff]
              text-white hover:bg-indigo-600 dark:hover:bg-[#5a52e0]
              shadow-sm transition-all duration-200 cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-[#6c63ff]/40"
            data-testid="add-button"
          >
            Add
          </button>
        </div>

        {/* ── Card ── */}
        <div
          className="rounded-2xl overflow-hidden
            bg-white dark:bg-[#16213e]
            border border-gray-100 dark:border-[#1e2d4a]
            shadow-md dark:shadow-none"
        >
          {/* Filter tabs */}
          <div className="flex border-b border-gray-100 dark:border-[#1e2d4a]">
            {(['all', 'active', 'completed'] as Filter[]).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wide
                  transition-colors duration-200 cursor-pointer
                  ${filter === f
                    ? 'text-indigo-500 dark:text-[#6c63ff] border-b-2 border-indigo-500 dark:border-[#6c63ff] -mb-px'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                data-testid={`filter-${f}`}
                aria-pressed={filter === f}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Todo list */}
          <div className="p-3 flex flex-col gap-2 min-h-[120px]">
            {filteredTodos.length === 0
              ? <EmptyState filter={filter} />
              : filteredTodos.map(todo => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={toggleTodo}
                    onDelete={deleteTodo}
                  />
                ))
            }
          </div>

          {/* Footer */}
          {todos.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3
              border-t border-gray-100 dark:border-[#1e2d4a]">
              <span
                className="text-xs text-gray-400 dark:text-gray-500"
                data-testid="active-count"
              >
                {activeCount} {activeCount === 1 ? 'item' : 'items'} left
              </span>
              {completedCount > 0 && (
                <button
                  type="button"
                  onClick={clearCompleted}
                  className="text-xs text-gray-400 dark:text-gray-500
                    hover:text-red-500 dark:hover:text-red-400
                    transition-colors duration-200 cursor-pointer"
                  data-testid="clear-completed"
                >
                  Clear Completed
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
