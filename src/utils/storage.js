// ----- Keys ---------------------------------------------------
const VAR_KEY           = 'variables';        // array<Variable>
const VAR_CHANGES_KEY   = 'variableChanges';  // array<VariableChange>
const MASTER_KEY        = 'masterTable';      // array<MasterRow>

// ----- Generic helpers ---------------------------------------
const get = (key, fallback = []) =>
  JSON.parse(localStorage.getItem(key) ?? JSON.stringify(fallback));

const set = (key, value) => localStorage.setItem(key, JSON.stringify(value));

// ----- API for each table ------------------------------------
export const storage = {
  // 1️⃣ Variables ------------------------------------------------
  getVariables: () => get(VAR_KEY),
  saveVariables: (vars) => set(VAR_KEY, vars),

  // 2️⃣ Variable Changes ----------------------------------------
  getVariableChanges: () => get(VAR_CHANGES_KEY),
  saveVariableChanges: (rows) => set(VAR_CHANGES_KEY, rows),

  // 3️⃣ Master Table -------------------------------------------
  getMasterRows: () => get(MASTER_KEY),
  saveMasterRows: (rows) => set(MASTER_KEY, rows),
};
