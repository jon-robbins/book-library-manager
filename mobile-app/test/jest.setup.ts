// React test renderer in RN can report uncaught errors via window.dispatchEvent.
// Some Jest environments do not provide this function by default.
if (typeof global.window === "undefined") {
  (global as any).window = {};
}

if (typeof (global as any).window.dispatchEvent !== "function") {
  (global as any).window.dispatchEvent = () => true;
}
