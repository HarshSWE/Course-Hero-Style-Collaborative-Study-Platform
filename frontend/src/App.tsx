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

function App() {
  return (
    <UserProvider>
      <FolderProvider>
        <ProfileImageProvider>
          <NotificationsProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/shared" element={<Shared />} />
                <Route path="/saved" element={<Saved />} />
                <Route path="/otpInput" element={<OtpInput />} />
              </Routes>
            </Router>
          </NotificationsProvider>
        </ProfileImageProvider>
      </FolderProvider>
    </UserProvider>
  );
}

export default App;
