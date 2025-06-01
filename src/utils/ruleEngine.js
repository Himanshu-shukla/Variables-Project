import {
  parseISO,
  format,
  differenceInCalendarDays,
  startOfQuarter,
  startOfYear,
} from "date-fns";

/**
 * does rowDate satisfy this “Every …” rule?
 * For brevity: only Day-of-Week | Date-of-Month | 1st-of-Quarter | N-days-offset
 */
export function ruleMatches(
  { between, betweenValue },
  rowDate,
  changeStart
) {
  switch (between) {
    case "Day of Week":
      return (
        rowDate.toLocaleDateString("en-US", { weekday: "long" }) ===
        betweenValue
      );

    case "Date of Month":
      return rowDate.getDate() === Number(betweenValue);

    case "Date of Quarter": {
      const diff =
        differenceInCalendarDays(rowDate, startOfQuarter(rowDate)) + 1;
      return diff === Number(betweenValue);
    }

    case "Date of Year": {
      const diff = differenceInCalendarDays(rowDate, startOfYear(rowDate)) + 1;
      return diff === Number(betweenValue);
    }

    case "Number of days (from start date of change date range)": {
      const interval = Number(betweenValue);
      if (interval <= 0) return false;

      const diff = differenceInCalendarDays(rowDate, changeStart);
      if (diff < 0) return false;
      if (interval === 1) return true;         // every day

      // fire on the last day of every N-day block
      return diff % interval === interval - 1; // 0-based index
    }

    default:
      return false;
  }
}

/** apply +2, *1.1 … to a number  */
export function applyBy(prev, byExpr) {
  if (!byExpr) return prev;
  const op = byExpr.trim()[0];
  const num = Number(byExpr.slice(1));
  switch (op) {
    case "+": return prev + num;
    case "-": return prev - num;
    case "*": return prev * num;
    case "/": return prev / num;
    case "^": return Math.pow(prev, num);
    default: return prev;
  }
}


export function applyByIndependent(
  row,
  expr
) {
  const m = expr.trim()
    .match(/^([A-Za-z_]\w*)\s*(?:([+\-*/^])\s*([-+]?\d*\.?\d+))?$/);
  if (!m) throw new Error(`Bad BY expression: "${expr}"`);

  const [, col, op, numStr] = m;
  const base = Number(row[col]);
  if (isNaN(base)) throw new Error(`Column "${col}" not found`);

  if (!op) return base; // plain “ABC”

  const num = Number(numStr);
  switch (op) {
    case "+": return base + num;
    case "-": return base - num;
    case "*": return base * num;
    case "/": return base / num;
    case "^": return Math.pow(base, num);
    default: return base;
  }
}
