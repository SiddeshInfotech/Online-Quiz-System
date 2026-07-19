const AuthDivider = () => {
  return (
    <div className="flex items-center gap-4">
      <div className="h-px flex-1 bg-slate-200" />
      <span className="text-xs font-medium uppercase tracking-wider text-app-muted">
        Or
      </span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
};

export default AuthDivider;