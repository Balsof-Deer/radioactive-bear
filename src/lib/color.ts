// Picks black or white text for use on top of `hex`. Uses YIQ perceived
// brightness with a threshold of 150 — chosen so every preset accent
// except orange keeps white text (matching how the app looked before
// custom accents existed), while light custom colors like pale yellow
// still get readable black text.
export function readableTextOn(hex: string): string {
  const match = /^#?([0-9a-f]{6}|[0-9a-f]{3})/i.exec(hex.trim());
  if (!match) return '#ffffff';

  const digits =
    match[1].length === 3
      ? match[1]
          .split('')
          .map((digit) => digit + digit)
          .join('')
      : match[1];

  const red = parseInt(digits.slice(0, 2), 16);
  const green = parseInt(digits.slice(2, 4), 16);
  const blue = parseInt(digits.slice(4, 6), 16);
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

  return brightness >= 150 ? '#000000' : '#ffffff';
}
