const FeaturePill = ({ icon: Icon, text }) => {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-md">
      <Icon size={16} />
      <span>{text}</span>
    </div>
  );
};

export default FeaturePill;