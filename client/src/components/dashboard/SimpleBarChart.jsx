export default function SimpleBarChart({ data = [], height = 220, color = "#0d9488" }) {
  const max = Math.max(1, ...data.map((d) => d.total));
  const maxLabel = data
    .map((d) => d.day)
    .sort()
    .at(-1);

  return (
    <div>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d) => {
          const h = Math.max(2, Math.round((d.total / max) * (height - 40)));
          const isLast = d.day === maxLabel;
          return (
            <div
              key={d.day}
              className="group relative flex flex-1 flex-col items-center justify-end self-stretch"
            >
              <span className="mb-1 text-[10px] font-semibold text-slate-400 opacity-0 transition group-hover:opacity-100">
                {d.total}
              </span>
              <div
                className="w-full rounded-t-md transition-all duration-500"
                style={{
                  height: h,
                  backgroundColor: isLast ? color : `${color}66`,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1.5">
        {data.map((d) => (
          <span
            key={d.day}
            className="flex-1 text-center text-[10px] font-medium text-slate-400"
          >
            {d.day.slice(5)}
          </span>
        ))}
      </div>
    </div>
  );
}
