import { useCallback, useRef } from 'react';

// Base64-encoded short notification sound (a gentle "ding")
const NOTIFICATION_SOUND_DATA = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleO0NKpTW9dyjZu7+GZjS0I+oAC6a0BYcn+sBPpnOWUmxLSCd0K9VvUsXoNC+WcdbE5/Pz1bMYRCe0OhT2nESndDxUOB7Ep3Q61DhgROd0OlQ43sTndDoT+aBEp3Q51DnghKd0OZQ6IISndDmUOiBEp3Q51DnghKd0OdQ5oESndDoUOWCEp3Q6VDjgxKd0OtQ4YQSndDsUN6FEp3Q7lDbhxKd0PBQ2IgSndDyUNSKEp3Q9FDQjBKd0PZQzI4SndD4UMiQEp3Q+lDDkhKd0PxQv5QSndD+ULuWEp3RAFe3mBKd0QJXs5oSntEEV6+dEZ7RB1erpxGe0QlXqKkRntELV6SrEZ7RDVegsxGe0Q9XnLURntERV5i3EZ7RE1eUuRGe0RVXkLsRntEXV4y9EZ7RGVeIvxGe0RtXhMERntEdV4DDEZ7RH1d8xRGe0SFXeMcRntEjV3TJEZ7RJVdwzBGe0SdXbM4RntEpV2jQEZ7RK1dk0hGe0S1XYNQRntEvV1zWEZ7RMVdY2BGe0TNXVNoRntE1V1DcEZ7RN1dM3hGe0TlXSOARntE7V0TiEZ7RPVdA5BGe0T9XPOYRntFBVzjoEZ7RQ1c06hGe0UVXMOwRntFHVyruEZ7RSVcm8BGe0UtXIvIRntFNVx70EZ7RT1ca9hGe0VFXFvgRntFTVxL6EZ7RVVcO/BGe0VdXCv4RntFZVwYAEp7RW1cCAhKe0V1X/gMSntFfV/oFEp7RYVf2BxKe0WNX8gkSntFlV+4LEp7RZ1fqDRKe0WlX5g8SntFrV+IREp7RbVfeFxKe0W9X2hkSntFxV9YbEp7Rc1fSHRKe0XVXzh8SntF3V8ohEp7ReVfGIxKe0XtXwiUSntF9V74nEp7Rf1e6KRKe0YFXtisS';

export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = useCallback(() => {
    try {
      // Create audio element if it doesn't exist
      if (!audioRef.current) {
        audioRef.current = new Audio(NOTIFICATION_SOUND_DATA);
        audioRef.current.volume = 0.5;
      }
      
      // Reset and play
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Ignore autoplay errors - browser may block without user interaction
      });
    } catch {
      // Ignore errors
    }
  }, []);

  return { playSound };
}
