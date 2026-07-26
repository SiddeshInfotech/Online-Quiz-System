import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthModalProvider } from "./context/AuthModalContext";
import PremiumUpgradeModal from "./components/common/PremiumUpgradeModal";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthModalProvider>
          <AppRoutes />
          <PremiumUpgradeModal />
        </AuthModalProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
