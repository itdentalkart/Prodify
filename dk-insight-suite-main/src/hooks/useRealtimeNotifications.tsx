import { useLiveFeed } from "./useLiveFeed";

export function useRealtimeNotifications() {
  const { events, connected } = useLiveFeed();
  return { events, connected, notifications: events };
}