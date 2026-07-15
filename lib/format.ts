const UNITS: { seconds: number; label: string }[] = [
  { seconds: 60, label: "second" },
  { seconds: 3600, label: "minute" },
  { seconds: 86400, label: "hour" },
  { seconds: 2592000, label: "day" },
  { seconds: 31536000, label: "month" },
  { seconds: Infinity, label: "year" },
];

const DIVISORS = [1, 60, 3600, 86400, 2592000, 31536000];

export function formatRelativeTime(dateString: string): string {
  const diffSeconds = (Date.now() - new Date(dateString).getTime()) / 1000;
  if (diffSeconds < 60) return "just now";

  for (let i = 0; i < UNITS.length; i++) {
    if (diffSeconds < UNITS[i].seconds) {
      const value = Math.floor(diffSeconds / DIVISORS[i]);
      return `${value} ${UNITS[i].label}${value === 1 ? "" : "s"} ago`;
    }
  }
  return "a while ago";
}
