const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export function apiUrl(pathname) {
  return `${API_BASE_URL}${pathname}`;
}
