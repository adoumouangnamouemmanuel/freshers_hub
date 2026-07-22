/**
 * usePushNotifications (Stubbed)
 *
 * Temporarily stubbed out to focus on in-app notifications.
 */
import { useCallback, useState } from "react";

export function usePushNotifications(accessToken: string | undefined) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const enablePush = useCallback(async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsEnabled(true);
      setIsLoading(false);
    }, 500);
  }, []);

  const disablePush = useCallback(async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsEnabled(false);
      setIsLoading(false);
    }, 500);
  }, []);

  return { isEnabled, isLoading, enablePush, disablePush };
}
