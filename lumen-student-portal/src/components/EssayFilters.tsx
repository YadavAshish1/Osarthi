export default function EssayFilters() {
  const filters = [
    { label: "All Teachers", testId: "filter-teacher" },
    { label: "All Classs", testId: "filter-class" },
    { label: "All Subjects", testId: "filter-subject" },
    { label: "All Topics", testId: "filter-topic" },
  ];

  return (
    <div data-testid="filter-bar" className="flex flex-wrap items-center gap-3">
      {filters.map((filter) => (
        <button
          key={filter.testId}
          type="button"
          data-testid={filter.testId}
          className="flex w-full items-center justify-between whitespace-nowrap border py-2 shadow-sm h-11 rounded-full bg-white border-[#E5E1D8] font-ui text-sm px-5 min-w-[150px] hover:border-[#A84C32] transition-colors"
        >
          <span style={{ pointerEvents: "none" }}>{filter.label}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-chevron-down h-4 w-4 opacity-50"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      ))}
    </div>
  );
}
