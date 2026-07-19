import { Link } from "react-router-dom";

const AuthFooter = ({ text, linkText, to }) => {
  return (
    <p className="mt-8 text-center text-sm text-app-muted">
      {text}{" "}
      <Link
        to={to}
        className="font-semibold text-violet-600 hover:text-violet-700"
      >
        {linkText}
      </Link>
    </p>
  );
};

export default AuthFooter;