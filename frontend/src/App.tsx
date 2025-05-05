import React from "react";
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import FileUpload from "./components/FileUpload";
import Home from "./components/Home";
import Shared from "./components/Shared";
import Saved from "./components/Saved";
import CommentsModal from "./components/CommentsModal";
import ProfilePicture from "./components/ProfilePicture";
import { ProfileImageProvider } from "./components/ProfileImageContext";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <ProfileImageProvider>
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
        </Routes>
      </Router>
    </ProfileImageProvider>
  );
}

export default App;
