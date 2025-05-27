import Login from "./components/Auth/Login";
import SignUp from "./components/Auth/SignUp";
import FileUpload from "./components/FileUpload";
import Home from "./components/Home";
import Shared from "./components/Shared";
import Saved from "./components/Saved";
import CommentsModal from "./components/Modals/CommentsModal";
import ProfilePicture from "./components/ProfilePicture";
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
                <Route path="/fileupload" element={<FileUpload />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/shared" element={<Shared />} />
                <Route path="/saved" element={<Saved />} />
                <Route
                  path="/CommentsModal"
                  element={
                    <CommentsModal
                      isOpen={true}
                      onClose={() => window.history.back()}
                    />
                  }
                />
                <Route path="/ProfilePicture" element={<ProfilePicture />} />
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
