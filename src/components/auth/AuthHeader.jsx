const AuthHeader = ({ title, subtitle }) => {
  return (
    <div className="mb-8 text-center">
      <h1 className="font-space-grotesk text-3xl font-bold text-app">
        {title}
      </h1>

      <p className="mt-2 text-sm leading-6 text-app-muted">
        {subtitle}
      </p>
    </div>
  );
};

export default AuthHeader;