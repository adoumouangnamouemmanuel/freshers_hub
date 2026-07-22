/**
 * usePushNotifications (Stubbed)
 *
 * Temporarily stubbed out to focus on in-app notifications.
 */
import { useCallback, useState } from "react";

export function usePushNotifications(accessToken: string | undefined) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // We keep expoPushToken undefined since we are stubbing
  const expoPushToken = undefined;

  const enablePush = useCallback(async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsEnabled(true);
      setIsLoading(false);
      // NOTE: In the real implementation, this would sync with POST /notifications/push-token
    }, 500);
  }, []);

  const disablePush = useCallback(async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsEnabled(false);
      setIsLoading(false);
      // NOTE: In the real implementation, this would sync with DELETE /notifications/push-token
    }, 500);
  }, []);

  return { isEnabled, isLoading, enablePush, disablePush, expoPushToken };
}
