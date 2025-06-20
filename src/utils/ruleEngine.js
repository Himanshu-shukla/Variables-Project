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
export function applyBy(prev, byExpr, vars = {}) {
  if (!byExpr) return prev;

  const expr = byExpr.trim();

  /* -- keep original one-letter operator shorthand ------------------ */
  const op = expr[0];
  const numPart = Number(expr.slice(1));
  if ("+-*/^".includes(op) && !isNaN(numPart)) {
    switch (op) {
      case "+": return prev + numPart;
      case "-": return prev - numPart;
      case "*": return prev * numPart;
      case "/": return numPart === 0 ? 0 : prev / numPart;
      case "^": return Math.pow(prev, numPart);
    }
  }

  /* -- otherwise: treat whole thing as a full expression ------------ */
  try {
    const result = evalExpr(expr, { prev, vars });
    /* spec: infinite decimals → 2-dp truncation */
    const safe = trunc(result, 2);
    return isFinite(safe) ? safe : 0;
  } catch (e) {
    console.error(`applyBy: bad expression "${expr}":`, e.message);
    return prev; // silently ignore bad BYs
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


//---------------------------------------- HELPER FUNCTIONS ----------------------------------------

/* ------------------------------------------------------------------ */
/* 1. helper maths / logic functions                                  */
/* ------------------------------------------------------------------ */
const rem = (a, b) => (b === 0 ? 0 : a - Math.trunc(a / b) * b);

/* keep only `dec` decimals, no rounding */
const trunc = (val, dec = 0) => {
  const f = 10 ** dec;
  return Math.trunc(val * f) / f;
};

const _roundCore = (val, dec = 0, mode = "nearest") => {
  const f = 10 ** dec;
  switch (mode) {
    case "up":    return Math.ceil (val * f) / f;
    case "down":  return Math.floor(val * f) / f;
    default:      return Math.round(val * f) / f;
  }
};
const round     = (v, d = 0) => _roundCore(v, d, "nearest");
const roundUp   = (v, d = 0) => _roundCore(v, d, "up");
const roundDown = (v, d = 0) => _roundCore(v, d, "down");

/* logic helpers */
const AND = (...args) => args.every(Boolean);
const OR  = (...args) => args.some(Boolean);
const NOT = (x)      => !x;
const IF  = (cond, t, f) => (cond ? t : f);

/* ------------------------------------------------------------------ */
/* 2. very small expression normaliser                                */
/* ------------------------------------------------------------------ */
function normalise(expr) {
  return expr
    /* function tokens ------------------------------------------------*/
    .replace(/\bRem\s*\(/gi,      "rem(")
    .replace(/\bTrunc\s*\(/gi,    "trunc(")
    .replace(/\bRoundup\s*\(/gi,  "roundUp(")
    .replace(/\bRounddown\s*\(/gi,"roundDown(")
    .replace(/\bRound\s*\(/gi,    "round(")
    .replace(/\bABS\s*\(/gi,      "Math.abs(")
    /* logical tokens -------------------------------------------------*/
    .replace(/\bAND\s*\(/gi,      "AND(")
    .replace(/\bOR\s*\(/gi,       "OR(")
    .replace(/\bNOT\s*\(/gi,      "NOT(")
    .replace(/\bIF\s*\(/gi,       "IF(")
    /* relations ------------------------------------------------------*/
    .replace(/<>/g,               "!=")          // not-equal
    /* single “=” that is _not_ part of “==”, “>=”, “<=”, “!=” --------*/
    .replace(/([^<>!=])=([^=])/g, "$1==$2")
    /* power operator -------------------------------------------------*/
    .replace(/\^/g,               "**");
}

/* ------------------------------------------------------------------ */
/* 3. core evaluator                                                  */
/* ------------------------------------------------------------------ */
function evalExpr(expr, context) {
  const src = `"use strict"; return (${normalise(expr)});`;
  return Function(
    "rem","trunc","round","roundUp","roundDown",
    "AND","OR","NOT","IF","Math","prev","vars",
    `with(vars){ ${src} }`
  )(
    rem,trunc,round,roundUp,roundDown,
    AND,OR,NOT,IF,Math,context.prev,context.vars
  );
}