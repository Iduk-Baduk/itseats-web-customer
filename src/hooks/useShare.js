import { useCallback } from "react";

export function useShare() {
  const url = window.location.href;

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      return { success: true, message: "링크가 복사되었습니다!" };
    } catch (err) {
      return { success: false, message: "복사에 실패했습니다." };
    }
  }, [url]);

    const copyToClipboardText = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return { success: true, message: "링크가 복사되었습니다!" };
    } catch (err) {
      return { success: false, message: "복사에 실패했습니다." };
    }
  }, []);

  const shareViaWebAPI = useCallback(async () => {
    if (!navigator.share) {
      return {
        success: false,
        message: "이 브라우저는 공유 기능을 지원하지 않습니다.",
      };
    }

    try {
      await navigator.share({
        title: document.title,
        text: "이 페이지를 확인해보세요!",
        url,
      });
      return { success: true, message: "공유가 완료되었습니다!" };
    } catch (err) {
      return { success: false, message: "공유에 실패했습니다." };
    }
  }, [url]);

  return {
    copyToClipboard,
    shareViaWebAPI,
    copyToClipboardText
  };
}