let _promise: Promise<void> | null = null;

export function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as any).google?.maps) return Promise.resolve();
  if (_promise) return _promise;

  _promise = new Promise<void>((resolve, reject) => {
    const cb = "__gmaps_cb__";
    (window as any)[cb] = () => {
      delete (window as any)[cb];
      resolve();
    };
    const script = document.createElement("script");
    script.src =
      `https://maps.googleapis.com/maps/api/js` +
      `?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}` +
      `&libraries=places` +
      `&loading=async` +
      `&callback=${cb}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      _promise = null;
      reject(new Error("Google Maps script failed to load"));
    };
    document.head.appendChild(script);
  });

  return _promise;
}
