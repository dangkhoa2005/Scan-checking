export function normalizeSku(rawValue) {
  if (rawValue === null || rawValue === undefined) return "";
  let str = typeof rawValue === "number" ? rawValue.toString() : rawValue.toString();
  str = str.trim();
  if (!str) return "";

  const lowered = str.toLowerCase();
  if (lowered.includes("e+")) {
    const num = Number(str);
    if (!Number.isNaN(num)) {
      return Number(num.toFixed(0)).toString();
    }
  }

  return str.replace(/\s+/g, "");
}