import { useState } from "react";

export function useNotificationCenter() {
  const [notifications] = useState([]);
  return { notifications, unreadCount: 0, markAllRead: () => {} };
}