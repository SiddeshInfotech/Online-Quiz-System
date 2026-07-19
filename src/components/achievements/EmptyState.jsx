import { Ghost } from "lucide-react";

const EmptyState = ({ message = "No badges found." }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 surface-elev text-slate-300 rounded-full flex items-center justify-center mb-4">
        <Ghost size={40} />
      </div>
      <h3 className="text-lg font-bold text-app-2 mb-1">Nothing here</h3>
      <p className="text-sm text-app-muted max-w-sm">
        {message}
      </p>
    </div>
  );
};

export default EmptyState;
