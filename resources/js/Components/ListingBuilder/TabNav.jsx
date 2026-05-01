export default function TabNav({ tabs = [], activeTab, onChange }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-md">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition duration-200 ${
              activeTab === tab
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  )
}
