import { FaGoogle, FaGithub } from "react-icons/fa";
import { GoogleLogin } from "@react-oauth/google";

const icons = {
  google: FaGoogle,
  github: FaGithub,
};

const labels = {
  google: "Continue with Google",
  github: "Continue with GitHub",
};

const SocialButton = ({ provider, onSuccess }) => {
  const Icon = icons[provider];

  if (provider === 'google') {
    return (
      <div className="flex w-full justify-center [&>div]:w-full">
        <GoogleLogin
          onSuccess={(credentialResponse) => {
            if (onSuccess) {
              onSuccess(credentialResponse.credential); // credential is the id_token
            }
          }}
          onError={() => {
            if (onError) onError();
          }}
          shape="rectangular"
          size="large"
          text="continue_with"
        />
      </div>
    );
  }

  const handleClick = () => {
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-app surface px-4 py-3 font-medium text-app-2 transition hover:border-violet-300 hover:bg-violet-50"
    >
      <Icon size={18} />
      {labels[provider]}
    </button>
  );
};

export default SocialButton;