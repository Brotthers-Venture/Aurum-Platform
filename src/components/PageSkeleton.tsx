export function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-3 border-b border-stone-200 pb-6">
        <div className="h-2.5 w-40 bg-stone-200" />
        <div className="h-6 w-96 bg-stone-200" />
      </div>
      <div className="h-[92px] rounded-[4px] border border-stone-200 bg-white" />
      <div className="h-[360px] rounded-[4px] border border-stone-200 bg-white" />
    </div>
  );
}
