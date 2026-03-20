export default function SkeletonCard() {
  return (
    <div className="glass rounded-xl overflow-hidden animate-pulse">
      {/* Fake image */}
      <div className="aspect-[16/9] bg-black/12" />
      <div className="p-4 space-y-3">
        {/* Source + time */}
        <div className="flex gap-2">
          <div className="h-4 w-20 bg-black/10 rounded-full" />
          <div className="h-4 w-16 bg-black/8 rounded-full ml-auto" />
        </div>
        {/* Title */}
        <div className="space-y-1.5">
          <div className="h-3.5 bg-black/12 rounded w-full" />
          <div className="h-3.5 bg-black/12 rounded w-5/6" />
        </div>
        {/* Desc */}
        <div className="space-y-1">
          <div className="h-3 bg-black/8 rounded w-full" />
          <div className="h-3 bg-black/8 rounded w-4/5" />
        </div>
        {/* Footer */}
        <div className="h-3 bg-black/6 rounded w-1/3 ml-auto mt-2" />
      </div>
    </div>
  );
}
