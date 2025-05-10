import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Grid,
  Typography,
  Checkbox,
  TextField,
  Select,
  MenuItem,
  IconButton,
  Button,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { useSnackbar } from "notistack";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import DeleteIcon from "@mui/icons-material/Delete";
import { storage } from "../utils/storage";
import { ruleMatches, applyBy } from "../utils/ruleEngine";
import { format } from "date-fns";

const dataTypes = [
  { label: "Decimal (2 float)", value: "decimal" },
  { label: "Integer", value: "integer" },
  { label: "Percentage (2 float)", value: "percentage" },
];

const BETWEEN_TYPE_OPTIONS = [
  "Date of Month",
  "Date of Quarter",
  "Date of Year",
  "Day of Week",
  "Number of days (from start date of change date range)",
];

function ChangePanel({ idx, data, onChange, onDelete }) {
  const handleField = (field, value) => {
    onChange(idx, { ...data, [field]: value });
  };

  return (
    <Paper variant="outlined" className="p-4 rounded-2xl shadow-sm mb-4">
      <Grid container spacing={2} alignItems="center">
        {/* Row 1 – Checkbox, Start / End date headers */}
        <Grid item xs={12} sm={2} md={1}>
          <Checkbox
            checked={data.enabled}
            onChange={(e) => handleField("enabled", e.target.checked)}
          />
        </Grid>
        <Grid item xs={6} sm={5} md={3}>
          <Typography variant="subtitle2">Start date</Typography>
        </Grid>
        <Grid item xs={6} sm={5} md={3}>
          <Typography variant="subtitle2">End date</Typography>
        </Grid>
        {/* Row 2 – Date pickers */}
        <Grid item xs={12} sm={2} md={1} /> {/* spacer under checkbox */}
        <Grid item xs={6} sm={5} md={3}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              value={data.startDate}
              onChange={(d) => handleField("startDate", d)}
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
          </LocalizationProvider>
        </Grid>
        <Grid item xs={6} sm={5} md={3}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              value={data.endDate}
              onChange={(d) => handleField("endDate", d)}
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
          </LocalizationProvider>
        </Grid>
        {/* Row 3 – "Change", "Between" labels */}
        <Grid item xs={12} sm={2} md={1}>
          <Typography variant="subtitle2">Change</Typography>
        </Grid>
        <Grid item xs={6} sm={5} md={3}>
          <Typography variant="subtitle2">Between</Typography>
        </Grid>
        <Grid item xs={6} sm={5} md={3} />
        {/* Row 4 – "Every" label + Between select */}
        <Grid item xs={12} sm={2} md={1}>
          <Typography variant="body2">Every</Typography>
        </Grid>
        <Grid item xs={6} sm={5} md={3}>
          <Select
            fullWidth
            size="small"
            value={data.between}
            onChange={(e) => handleField("between", e.target.value)}
          >
            {BETWEEN_TYPE_OPTIONS.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid item xs={6} sm={4} md={4}>
          <TextField
            fullWidth
            size="small"
            placeholder="Enter value (e.g., Monday, 1, 2)"
            value={data.betweenValue}
            onChange={(e) => handleField("betweenValue", e.target.value)}
          />
        </Grid>
        <Grid item xs={6} sm={5} md={3} />
        {/* Row 5 – On Previous Value / By ... dropdown */}
        <Grid item xs={12} sm={2} md={1}>
          <Select
            fullWidth
            size="small"
            value={data.onType || "On Previous Value"}
            onChange={(e) => handleField("onType", e.target.value)}
          >
            <MenuItem value="On Previous Value">On Previous Value</MenuItem>
            <MenuItem value="Independent">Independent</MenuItem>
          </Select>
        </Grid>
        <Grid item xs={6} sm={5} md={3}>
          <Typography variant="body2">By</Typography>
        </Grid>
        <Grid item xs={6} sm={5} md={3}>
          <TextField
            fullWidth
            size="small"
            value={data.by}
            onChange={(e) => handleField("by", e.target.value)}
            placeholder="Enter expression (e.g. +2, *var, IF(,,))"
          />
        </Grid>
        {/* Row 6 – (OR) Set to */}
        <Grid item xs={12} sm={2} md={1}>
          <Typography variant="caption" color="text.secondary">
            (OR)
          </Typography>
        </Grid>
        <Grid item xs={6} sm={5} md={3}>
          <Typography variant="body2">Set to</Typography>
        </Grid>
        <Grid item xs={6} sm={5} md={3}>
          <TextField
            fullWidth
            size="small"
            value={data.setTo}
            onChange={(e) => handleField("setTo", e.target.value)}
          />
        </Grid>
      </Grid>
    </Paper>
  );
}

export default function CreateModify() {
  const navigate = useNavigate();
  const { state } = useLocation(); // { mode, index }
  const { enqueueSnackbar } = useSnackbar();

  const pageMode = state?.pageMode ?? "variable";
  const editMode = state?.mode === "edit";
  const editIdx = state?.editIdx ?? -1;

  // ----------------------- form state -----------------------
  const [name, setName] = useState("");
  const [dataType, setDataType] = useState("decimal");
  const [unit, setUnit] = useState("");
  const [initialValue, setInitial] = useState("");

  const defaultPanel = {
    enabled: false,
    startDate: null,
    endDate: null,
    between: BETWEEN_TYPE_OPTIONS[0],
    betweenValue: "",
    onType: "On Previous Value",
    by: "",
    setTo: "",
  };

  const [changes, setChanges] = useState([defaultPanel]);

  const updateChange = (idx, patch) => {
    setChanges((prev) => prev.map((c, i) => (i === idx ? patch : c)));
  };

  const addChange = () => {
    setChanges((prev) => [
      ...prev,
      {
        enabled: false,
        startDate: null,
        endDate: null,
        between: BETWEEN_TYPE_OPTIONS[0],
        by: "",
        setTo: "",
      },
    ]);
  };

  const deleteChange = (idx) => {
    setChanges((prev) => prev.filter((_, i) => i !== idx));
  };

  // ---------- if editing, pre‑load the chosen variable -------
  useEffect(() => {
    if (!editMode) return;
    const vars = storage.getVariables();
    const v = vars[editIdx];
    if (v) {
      setName(v.name);
      setDataType(v.datatype);
      setUnit(v.unit);
      setInitial(v.initial);
    } else {
      enqueueSnackbar("Variable not found.", { variant: "error" });
      navigate("/variables");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------------- submit --------------------------
  const handleSubmitVariable = () => {
    if (!name.trim() || !dataType || !unit.trim() || initialValue === "") {
      enqueueSnackbar("All fields are required.", { variant: "error" });
      return;
    }

    if (name.length > 15 || unit.length > 3) {
      enqueueSnackbar("Name ≤ 15 chars, Unit ≤ 3 chars", {
        variant: "warning",
      });
      return;
    }

    const parsedInit =
      dataType === "integer"
        ? parseInt(initialValue)
        : parseFloat(initialValue);

    const newVar = {
      name,
      datatype: dataType,
      unit,
      initial: parsedInit,
      min: parsedInit,
      max: parsedInit,
    };

    const vars = storage.getVariables();

    // duplicate-name check (ignore current row in edit mode)
    const duplicate = vars.some(
      (v, idx) => v.name === name && idx !== (editIdx ?? -1)
    );
    if (duplicate) {
      enqueueSnackbar("Name must be unique", { variant: "error" });
      return;
    }

    let updatedVars;
    if (editMode) {
      const oldVar = vars[editIdx];
      updatedVars = [...vars];
      updatedVars[editIdx] = newVar;
      localStorage.setItem("selectedVariableIndex", editIdx);
      enqueueSnackbar("Variable updated", { variant: "success" });

      // --- column rename if name changed ----------------------
      if (oldVar.name !== name) {
        storage.renameColumnInMaster(oldVar.name, name);

        // also rename in variableChanges
        const changes = storage.getVariableChanges();
        const patched = changes.map((c) =>
          c.variableName === oldVar.name ? { ...c, variableName: name } : c
        );
        storage.saveVariableChanges(patched);
      }

      // --- initial value change: patch rows before first change
      if (oldVar.initial !== parsedInit) {
        const firstChange = storage
          .getVariableChanges()
          .filter((c) => c.variableName === name)
          .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0];

        const cutOffISO = firstChange
          ? firstChange.startDate
          : localStorage.getItem("toDate");
        storage.patchInitialValues(name, parsedInit, cutOffISO);
      }
    } else {
      // ---------- CREATE mode ---------------------------------
      updatedVars = [...vars, newVar];
      localStorage.setItem("selectedVariableIndex", updatedVars.length - 1);
      enqueueSnackbar("Variable created", { variant: "success" });

      storage.addColumnToMaster({ name, initial: parsedInit });
    }

    storage.saveVariables(updatedVars);
    navigate("/variables");
  };

  const handleSubmitChange = () => {
    const fromLS = new Date(localStorage.getItem("fromDate"));
    const toLS = new Date(localStorage.getItem("toDate"));

    for (const c of changes) {
      if (!c.startDate || !c.endDate || !c.betweenValue)
        return enqueueSnackbar("All Change fields must be filled.", {
          variant: "error",
        });

      if (c.startDate < fromLS || c.endDate > toLS)
        return enqueueSnackbar(
          "Start / End must lie inside Dashboard date range.",
          { variant: "error" }
        );

      if (c.onType === "On Previous Value" && +c.startDate === +fromLS)
        return enqueueSnackbar(
          "Start date must be after overall From date for ‘On Previous Value’.",
          { variant: "error" }
        );

      if (!(c.by || c.setTo))
        return enqueueSnackbar("Either BY or SET TO must be provided.", {
          variant: "error",
        });
    }

    // 2️⃣  persist to variableChanges table ----------------------
    const varName = name.trim();
    const prevChanges = storage.getVariableChanges();
    const nextChanges = [
      ...prevChanges.filter((r) => r.name !== varName),
      ...changes.map((c, i) => ({
        name: varName,
        changeNo: i + 1,
        startDate: format(c.startDate, "dd MMM yy"),
        endDate: format(c.endDate, "dd MMM yy"),
        every: `${c.betweenValue} ${c.betweenType}`,
        by: c.by,
        setTo: c.setTo,
      })),
    ];
    storage.saveVariableChanges(nextChanges);

    // 3️⃣  mutate master table ------------------------------------
    let rows = storage.getMasterRows(); // already sorted chronologically
    const initVal = rows.find((r) => r[varName] !== undefined)[varName];

    // sort changes by startDate so we walk once
    const sorted = [...changes].sort((a, b) => a.startDate - b.startDate);

    let currentVal = initVal;
    rows = rows.map((r) => {
      const d = new Date(r.date);

      // is this row affected by any change?
      sorted.forEach((ch) => {
        if (
          d >= ch.startDate &&
          d <= ch.endDate &&
          ruleMatches(ch, d, ch.startDate)
        ) {
          if (ch.onType === "On Previous Value") {
            currentVal = ch.by ? applyBy(currentVal, ch.by) : Number(ch.setTo);
          } else {
            // Independent
            currentVal = ch.setTo ? Number(ch.setTo) : applyBy(initVal, ch.by);
          }
        }
      });

      return { ...r, [varName]: Number(currentVal.toFixed(2)) };
    });

    storage.saveMasterRows(rows);
    enqueueSnackbar("Changes applied!", { variant: "success" });
  };

  // ------------------------- UI ------------------------------
  return (
    <Grid container spacing={2} sx={{ p: 2 }}>
      {/* name */}
      <Grid item xs={12} sm={6}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item xs={4}>
            <Typography>Name</Typography>
          </Grid>
          <Grid item xs={8}>
            <TextField
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              inputProps={{ maxLength: 15 }}
            />
          </Grid>
        </Grid>
      </Grid>
      {/* datatype */}
      <Grid item xs={12} sm={6}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item xs={4}>
            <Typography>DataType</Typography>
          </Grid>
          <Grid item xs={8}>
            <TextField
              select
              fullWidth
              required
              value={dataType}
              onChange={(e) => setDataType(e.target.value)}
            >
              {dataTypes.map((d) => (
                <MenuItem key={d.value} value={d.value}>
                  {d.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item xs={4}>
            <Typography>Unit</Typography>
          </Grid>
          <Grid item xs={8}>
            <TextField
              fullWidth
              required
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              slotProps={{ input: { maxLength: 3 } }}
            />
          </Grid>
        </Grid>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item xs={4}>
            <Typography>Initial Value</Typography>
          </Grid>
          <Grid item xs={8}>
            <TextField
              fullWidth
              required
              value={initialValue}
              onChange={(e) => {
                const val = e.target.value;

                // live filtering based on datatype
                if (dataType === "integer") {
                  if (/^\d*$/.test(val)) setInitial(val); // allow only digits
                } else {
                  if (/^\d*\.?\d{0,2}$/.test(val)) setInitial(val); // up to 2 decimals
                }
              }}
              slotProps={{
                input: {
                  inputMode: "decimal",
                  step: dataType === "integer" ? "1" : "0.01",
                },
              }}
              error={
                dataType === "integer"
                  ? !/^\d+$/.test(initialValue) && initialValue !== ""
                  : !/^\d+(\.\d{1,2})?$/.test(initialValue) &&
                    initialValue !== ""
              }
              helperText={
                initialValue !== "" &&
                (dataType === "integer"
                  ? "Must be a whole number"
                  : "Up to 2 decimal places")
              }
            />
          </Grid>
        </Grid>
      </Grid>
      <Box className="p-4 space-y-4">
        {changes.map((panel, idx) => (
          <ChangePanel
            key={idx}
            idx={idx}
            data={panel}
            onChange={updateChange}
            onDelete={deleteChange}
          />
        ))}

        <Box display="flex" justifyContent="space-between" mt={2}>
          <Box sx={{ width: "25%" }}>
            <Button variant="contained" onClick={addChange}>
              Add another change
            </Button>
          </Box>

          <Box sx={{ width: "50%", display: "flex", justifyContent: "left" }}>
            <Button variant="outlined" color="error" onClick={deleteChange}>
              Delete Change
            </Button>
          </Box>
        </Box>
      </Box>
      <Grid item xs={12}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="contained"
              onClick={
                pageMode !== "change"
                  ? handleSubmitChange
                  : handleSubmitVariable
              }
            >
              Submit
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate("/variables")}
            >
              Back
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}
