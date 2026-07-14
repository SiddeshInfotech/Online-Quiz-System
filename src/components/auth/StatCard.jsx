const StatCard = ({ icon: Icon, value, label }) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20">
        <Icon size={18} className="text-violet-300" />
      </div>

      <h3 className="text-2xl font-bold text-white">{value}</h3>

      <p className="mt-1 text-sm text-slate-300">{label}</p>
    </div>
  );
};

export default StatCard;