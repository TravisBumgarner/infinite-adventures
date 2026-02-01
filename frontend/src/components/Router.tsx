import { ReactFlowProvider } from "@xyflow/react";
import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Canvas from "../pages/Canvas/Canvas";
import Login from "../pages/Login/Login.js";
import PasswordReset from "../pages/PasswordReset/PasswordReset.js";
import Signup from "../pages/Signup/Signup.js";
import { useAppStore } from "../stores/appStore";

export function MemberRoute({ children }: { children: ReactNode }) {
  const user = useAppStore((s) => s.user);
  const loading = useAppStore((s) => s.authLoading);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

export function AnonymousRoute({ children }: { children: ReactNode }) {
  const user = useAppStore((s) => s.user);
  const loading = useAppStore((s) => s.authLoading);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  return <>{children}</>;
}

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
