import Login from "./components/Auth/Login";
import SignUp from "./components/Auth/SignUp";
import Home from "./components/Home/Home";
import Shared from "./components/Home/Shared";
import Saved from "./components/Home/Saved";
import OtpInput from "./components/Auth/OtpInput";
import { ProfileImageProvider } from "./components/ContextProviders/ProfileImageContext";
import { FolderProvider } from "./components/ContextProviders/FolderContext";
import { UserProvider } from "./components/ContextProviders/UserContext";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { NotificationsProvider } from "./components/ContextProviders/NotificationsContext";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <UserProvider>
      <FolderProvider>
        <ProfileImageProvider>
          <NotificationsProvider>
            <Router>
              <Routes>
                <Route path="/" element={<SignUp />} />
                <Route path="/login" element={<Login />} />
                <Route path="/otpInput" element={<OtpInput />} />

                <Route
                  path="/home"
                  element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/shared"
                  element={
                    <ProtectedRoute>
                      <Shared />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/saved"
                  element={
                    <ProtectedRoute>
                      <Saved />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Router>
          </NotificationsProvider>
        </ProfileImageProvider>
      </FolderProvider>
    </UserProvider>
  );
}

export default App;
