import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthModalProvider } from "./context/AuthModalContext";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthModalProvider>
          <AppRoutes />
        </AuthModalProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
