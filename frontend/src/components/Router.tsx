import { ReactFlowProvider } from "@xyflow/react";
import { Route, Routes } from "react-router-dom";
import Canvas from "../pages/Canvas/Canvas";
import Login from "../pages/Login/Login.js";
import PasswordReset from "../pages/PasswordReset/PasswordReset.js";
import Signup from "../pages/Signup/Signup.js";
import AnonymousRoute from "./AnonymousRoute.js";
import MemberRoute from "./MemberRoute.js";

export default function Router() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <MemberRoute>
            <ReactFlowProvider>
              <Canvas />
            </ReactFlowProvider>
          </MemberRoute>
        }
      />
      <Route
        path="/login"
        element={
          <AnonymousRoute>
            <Login />
          </AnonymousRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <AnonymousRoute>
            <Signup />
          </AnonymousRoute>
        }
      />
      <Route path="/password-reset" element={<PasswordReset />} />
    </Routes>
  );
}
