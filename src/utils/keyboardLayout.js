// All coordinates are window coordinates: a SafeArea parent's local y=0 must
// never be compared directly with the keyboard's absolute screenY.
export function keyboardOverlap(frame, keyboard) {
  if (!frame || !keyboard || keyboard.height <= 0 || !Number.isFinite(keyboard.screenY)) return 0;
  const horizontal = !Number.isFinite(keyboard.screenX) || !keyboard.width || keyboard.screenX < frame.x + frame.width && keyboard.screenX + keyboard.width > frame.x;
  return horizontal ? Math.min(frame.height, Math.max(0, frame.y + frame.height - keyboard.screenY)) : 0;
}
