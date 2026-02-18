import { ReactFlowProvider } from "@xyflow/react";
import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Canvas from "../pages/Canvas/Canvas";
import Gallery from "../pages/Gallery";
import Login from "../pages/Login/Login.js";
import Marketing from "../pages/Marketing/Marketing";
import NotFound from "../pages/NotFound";
import PasswordReset from "../pages/PasswordReset/PasswordReset.js";
import Sessions from "../pages/Sessions";
import Signup from "../pages/Signup/Signup.js";
import Timeline from "../pages/Timeline";
import TreeView from "../pages/TreeView";
import { useAppStore } from "../stores/appStore";
import MemberLayout from "./MemberLayout";

export function MemberRoute({ children }: { children: ReactNode }) {
  const user = useAppStore((s) => s.user);
  const loading = useAppStore((s) => s.authLoading);

  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;

  return <>{children}</>;
}

export function AnonymousRoute({ children }: { children: ReactNode }) {
  const user = useAppStore((s) => s.user);
  const loading = useAppStore((s) => s.authLoading);

  if (loading) return null;
  if (user) return <Navigate to="/canvas" replace />;

  return <>{children}</>;
}

function HomePage() {
  const user = useAppStore((s) => s.user);
  const loading = useAppStore((s) => s.authLoading);

  if (loading) return null;

  if (user) {
    return (
      <MemberLayout>
        <ReactFlowProvider>
          <Canvas />
        </ReactFlowProvider>
      </MemberLayout>
    );
  }

  return <Marketing />;
}

export default function Router() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/canvas"
        element={
          <MemberRoute>
            <MemberLayout>
              <ReactFlowProvider>
                <Canvas />
              </ReactFlowProvider>
            </MemberLayout>
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
      <Route
        path="/sessions"
        element={
          <MemberRoute>
            <MemberLayout>
              <Sessions />
            </MemberLayout>
          </MemberRoute>
        }
      />
      <Route
        path="/sessions/:sessionId"
        element={
          <MemberRoute>
            <MemberLayout>
              <Sessions />
            </MemberLayout>
          </MemberRoute>
        }
      />
      <Route
        path="/timeline"
        element={
          <MemberRoute>
            <MemberLayout>
              <Timeline />
            </MemberLayout>
          </MemberRoute>
        }
      />
      <Route
        path="/gallery"
        element={
          <MemberRoute>
            <MemberLayout>
              <Gallery />
            </MemberLayout>
          </MemberRoute>
        }
      />
      <Route
        path="/tree"
        element={
          <MemberRoute>
            <MemberLayout>
              <ReactFlowProvider>
                <TreeView />
              </ReactFlowProvider>
            </MemberLayout>
          </MemberRoute>
        }
      />
      <Route path="/password-reset" element={<PasswordReset />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
