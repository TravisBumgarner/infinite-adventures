import { ReactFlowProvider } from "@xyflow/react";
import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { STORAGE_KEY_POST_AUTH_REDIRECT } from "../constants";
import Canvas from "../pages/Canvas";
import Gallery from "../pages/Gallery";
import PhotoDetail from "../pages/Gallery/PhotoDetail";
import Login from "../pages/Login";
import Marketing from "../pages/Marketing";
import NotFound from "../pages/NotFound";
import PasswordReset from "../pages/PasswordReset";
import ReleaseNotes from "../pages/ReleaseNotes";
import Sessions from "../pages/Sessions";
import SharedViewer from "../pages/Shared";
import Signup from "../pages/Signup";
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
  if (user) {
    const redirect = localStorage.getItem(STORAGE_KEY_POST_AUTH_REDIRECT);
    if (redirect) localStorage.removeItem(STORAGE_KEY_POST_AUTH_REDIRECT);
    return <Navigate to={redirect ?? "/canvas"} replace />;
  }

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
        path="/gallery/:photoId"
        element={
          <MemberRoute>
            <MemberLayout>
              <PhotoDetail />
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
      <Route path="/shared/:token" element={<SharedViewer />} />
      <Route path="/password-reset" element={<PasswordReset />} />
      <Route path="/release-notes" element={<ReleaseNotes />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
