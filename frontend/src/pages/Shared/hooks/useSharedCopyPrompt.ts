import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { copySharedContent } from "../../../api/shares";
import { STORAGE_KEY_SHARED_COPY_PROMPT } from "../../../constants";
import { useAppStore } from "../../../stores/appStore";

export function useSharedCopyPrompt(token: string) {
  const user = useAppStore((s) => s.user);
  const authLoading = useAppStore((s) => s.authLoading);
  const showToast = useAppStore((s) => s.showToast);
  const navigate = useNavigate();
  const [showPrompt, setShowPrompt] = useState(false);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (user && localStorage.getItem(STORAGE_KEY_SHARED_COPY_PROMPT)) {
      localStorage.removeItem(STORAGE_KEY_SHARED_COPY_PROMPT);
      setShowPrompt(true);
    }
  }, [user, authLoading]);

  const handleCopy = async () => {
    setCopying(true);
    try {
      const result = await copySharedContent(token);
      showToast("Copied to your workspace!");
      navigate(`/canvas?canvasId=${result.id}`);
    } catch {
      showToast("Failed to copy");
      setShowPrompt(false);
    } finally {
      setCopying(false);
    }
  };

  const dismiss = () => setShowPrompt(false);

  return { showPrompt, copying, handleCopy, dismiss };
}
