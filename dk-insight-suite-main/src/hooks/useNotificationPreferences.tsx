import { useState } from "react";

export function useNotificationPreferences() {
  const [prefs, setPrefs] = useState({ email: true, push: false });
  return { prefs, updatePrefs: setPrefs };
}