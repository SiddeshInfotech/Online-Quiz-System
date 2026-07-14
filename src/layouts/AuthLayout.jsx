import { Outlet } from "react-router-dom";
import BrandPanel from "../components/auth/BrandPanel";

const AuthLayout = () => {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left Branding Section */}
        <BrandPanel />

        {/* Right Authentication Section */}
        <section className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </section>
      </div>
    </main>
  );
};

export default AuthLayout;