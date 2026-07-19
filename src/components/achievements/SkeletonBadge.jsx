import Card from "../ui/Card/Card";

const SkeletonBadge = () => {
  return (
    <Card className="p-6 relative overflow-hidden animate-pulse flex flex-col gap-4">
      {/* Top row: Image and Title */}
      <div className="flex gap-4 items-start">
        <div className="w-16 h-16 rounded-2xl bg-slate-200 shrink-0" />
        <div className="flex-1 flex flex-col gap-2 pt-1">
          <div className="h-5 w-3/4 bg-slate-200 rounded-lg" />
          <div className="h-4 w-1/2 surface-elev rounded-lg" />
        </div>
      </div>

      {/* Description */}
      <div className="h-4 w-full surface-elev rounded-lg mt-2" />
      <div className="h-4 w-4/5 surface-elev rounded-lg" />

      {/* Progress Bar area */}
      <div className="mt-auto pt-4 border-t border-slate-50 flex flex-col gap-2">
        <div className="flex justify-between">
          <div className="h-3 w-1/4 surface-elev rounded-lg" />
          <div className="h-3 w-1/4 surface-elev rounded-lg" />
        </div>
        <div className="h-2 w-full bg-slate-200 rounded-full" />
      </div>
    </Card>
  );
};

export default SkeletonBadge;
