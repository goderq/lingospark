export const themeModes = ['system', 'light', 'dark'];
export const resolveScheme = (mode, system) => mode === 'light' || mode === 'dark' ? mode : system === 'dark' ? 'dark' : 'light';
export function foregroundFor(background) {
  let hex = String(background || '').replace('#', '');
  if (hex.length === 3) hex = [...hex].map(value => value + value).join('');
  if (!/^[\da-f]{6}$/i.test(hex)) return '#FFFFFF';
  const rgb = hex.match(/../g).map(value => parseInt(value, 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  const light = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  if (1.05 / (light + 0.05) >= 4.5) return '#FFFFFF';
  return (light + 0.05) / 0.058 > 4.5 ? '#101523' : '#000000';
}
export const palettes = {
  light: { background: '#F5F6FB', card: '#FFFFFF', cardLight: '#ECEEF7', text: '#19213A', white: '#19213A', textMuted: '#606A81', border: '#DDE2EF', purple: '#6544DB', mint: '#067363', orange: '#A65308', pink: '#BE315F', onAccent: '#FFFFFF', accentSoft: '#EDE7FF', successSoft: '#E1F4EE', warningSoft: '#FFF0DF', dangerSoft: '#FCE7EF', scrim: 'rgba(16,23,43,0.44)', track: '#E0E4F0', blue: '#2563B8', shadow: '#243458', accentFill: '#6845DE' },
  dark: { background: '#0D1120', card: '#181F32', cardLight: '#242E45', text: '#F3F5FC', white: '#F3F5FC', textMuted: '#A7B2C9', border: '#303B54', purple: '#AB91FF', mint: '#55D9BF', orange: '#FFBA71', pink: '#FF91B1', onAccent: '#FFFFFF', accentSoft: '#30264F', successSoft: '#173F3B', warningSoft: '#453021', dangerSoft: '#47273C', scrim: 'rgba(0,0,0,0.6)', track: '#303B54', blue: '#89B8FF', shadow: '#000000', accentFill: '#6845DE' },
};
