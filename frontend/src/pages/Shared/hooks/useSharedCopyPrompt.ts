import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { copySharedContent } from "../../../api/shares";
import { STORAGE_KEY_ACTIVE_CANVAS, STORAGE_KEY_POST_AUTH_REDIRECT } from "../../../constants";
import { useAppStore } from "../../../stores/appStore";

export function useSharedCopyPrompt(token: string) {
  const user = useAppStore((s) => s.user);
  const authLoading = useAppStore((s) => s.authLoading);
  const showToast = useAppStore((s) => s.showToast);
  const navigate = useNavigate();
  const [showPrompt, setShowPrompt] = useState(false);
  const [copying, setCopying] = useState(false);
  const redirectValue = useRef<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    const redirect = localStorage.getItem(STORAGE_KEY_POST_AUTH_REDIRECT);
    if (user && redirect?.startsWith("/shared/")) {
      redirectValue.current = redirect;
      localStorage.removeItem(STORAGE_KEY_POST_AUTH_REDIRECT);
      setShowPrompt(true);
    }
  }, [user, authLoading]);

  const handleCopy = async () => {
    setCopying(true);
    try {
      const result = await copySharedContent(token);
      localStorage.setItem(STORAGE_KEY_ACTIVE_CANVAS, result.id);
      showToast("Copied to your workspace!");
      navigate("/canvas");
    } catch {
      showToast("Failed to copy");
      setShowPrompt(false);
    } finally {
      setCopying(false);
    }
  };

  const later = () => {
    if (redirectValue.current) {
      localStorage.setItem(STORAGE_KEY_POST_AUTH_REDIRECT, redirectValue.current);
    }
    setShowPrompt(false);
  };

  const decline = () => setShowPrompt(false);

  return { showPrompt, copying, handleCopy, later, decline };
}
