import { parseISO, format } from "date-fns";

/**
 * does rowDate satisfy this “Every …” rule?
 * For brevity: only Day-of-Week | Date-of-Month | 1st-of-Quarter | N-days-offset
 */
export function ruleMatches({ between, betweenValue }, rowDate, changeStart) {
  switch (between) {
    case "Day of Week":       // betweenValue e.g. "Monday"
      return rowDate.toLocaleDateString("en-US", { weekday: "long" }) === betweenValue;

    case "Date of Month":     // betweenValue numeric 1-31
      return rowDate.getDate() === Number(betweenValue);

    case "Date of Quarter": { // 1 = first day of qtr, 92 = last
      const qStart = new Date(rowDate.getFullYear(), Math.floor(rowDate.getMonth() / 3) * 3, 1);
      const diff   = Math.floor((rowDate - qStart) / 864e5) + 1;
      return diff === Number(betweenValue);
    }
    case "Number of Days": {  // N days from change start
      const diff = Math.floor((rowDate - changeStart) / 864e5);
      return diff === Number(betweenValue);
    }
    default:
      return false;
  }
}

/** apply +2, *1.1 … to a number  */
export function applyBy(prev, byExpr) {
  const op = byExpr.trim()[0];               // +  -  *  /  ^
  const num = Number(byExpr.slice(1));
  switch (op) {
    case "+": return prev + num;
    case "-": return prev - num;
    case "*": return prev * num;
    case "/": return prev / num;
    case "^": return Math.pow(prev, num);
    default:  return prev;
  }
}
