import { Loader2, Search, Sparkles, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
  semanticActive?: boolean;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search exercises...',
  loading = false,
  semanticActive = false,
}: SearchBarProps) {
  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm text-slate-900 placeholder-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
        />
        {loading ? (
          <Loader2
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-brand-500"
            aria-label="Searching…"
          />
        ) : value ? (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>
      {semanticActive && !loading && (
        <p className="flex items-center gap-1 text-xs text-brand-500 dark:text-brand-400">
          <Sparkles size={11} />
          Smart search by Omni
        </p>
      )}
    </div>
  );
}
