// utils/storage.js
// =============================================================

// ---------- keys ---------------------------------------------
const VAR_KEY = "variables";        // array<Variable>
const VAR_CHANGES_KEY = "variableChanges";  // array<VariableChange>
const MASTER_KEY = "masterTable";      // array<MasterRow>
const DATE_RANGE_KEY = "dateRange";        // { fromDate, toDate }  (ISO strings)

// ---------- generic helpers ----------------------------------
const get = (key, fallback) => {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;

  try {
    return JSON.parse(raw);
  } catch (e) {
    return raw; // if not valid JSON, return as-is (string)
  }
};

const set = (key, value) => localStorage.setItem(key, JSON.stringify(value));

// ---------- public API ---------------------------------------
export const storage = {
  /* 1️⃣ variables ------------------------------------------------ */
  getVariables: () => get(VAR_KEY),
  saveVariables: (vars) => set(VAR_KEY, vars),

  /* 2️⃣ variable changes ----------------------------------------- */
  getVariableChanges: () => get(VAR_CHANGES_KEY),
  saveVariableChanges: (rows) => set(VAR_CHANGES_KEY, rows),

  /* 3️⃣ master table --------------------------------------------- */
  getMasterRows: () => get(MASTER_KEY),
  saveMasterRows: (rows) => set(MASTER_KEY, rows),

  /* 3a  add a new column to every row when a variable is created  */
  addColumnToMaster({ name, initial }) {
    let rows = this.getMasterRows();

    // bootstrap the skeleton if the table is empty
    if (!rows.length) rows = this._bootstrapSkeleton();

    // patch every row with the new column
    const patched = rows.map((r) => ({ ...r, [name]: initial }));
    this.saveMasterRows(patched);
  },

  /* 3b  rename a column everywhere – call this in “edit mode”
         **only** if the variable’s name changes                  */
  renameColumnInMaster(oldName, newName) {
    if (oldName === newName) return;

    const rows = this.getMasterRows().map((r) => {
      if (!(oldName in r)) return r;            // nothing to do
      const { [oldName]: val, ...rest } = r;    // remove old key
      return { ...rest, [newName]: val };       // add new key
    });
    this.saveMasterRows(rows);
  },

  /* ---------- private helpers ---------------------------------- */
  _bootstrapSkeleton() {
    const fromDate = get("fromDate");
    const toDate = get("toDate");

    if (!fromDate || !toDate) {
      console.warn("⚠️ Missing date range in localStorage");
      return [];
    }

    const start = new Date(fromDate);
    const end = new Date(toDate);
    const rows = [];

    for (
      let idx = 1, cur = new Date(start);
      cur <= end;
      idx++, cur.setDate(cur.getDate() + 1)
    ) {
      rows.push({
        sno: idx,
        date: cur.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "2-digit",
        }), // 01-Apr-25
        dow: cur.toLocaleDateString("en-GB", { weekday: "short" }), // Tue
      });
    }

    return rows;
  }
};
