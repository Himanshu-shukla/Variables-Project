import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Paper,
  Grid,
  Typography,
  Checkbox,
  Stack,
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
import { storage } from "../utils/storage";
import { ruleMatches, applyBy, applyByIndependent } from "../utils/ruleEngine";
import { format, parse } from "date-fns";

const dataTypes = [
  { label: "Decimal (2 float)", value: "decimal" },
  { label: "Integer", value: "integer" },
  { label: "Percentage (2 float)", value: "percentage" },
];

const BETWEEN_TYPE_OPTIONS = [
  "Day of Month",
  "Day of Quarter",
  "Day of Year",
  "Day of Week",
  "Number of days (from start date of change date range)",
];

function ChangePanel({ idx, data, onChange }) {
  const handle = (field, value) => onChange(idx, { ...data, [field]: value });

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 2,
        width: '100%',
        maxWidth: { xs: '100%', md: '50%' },
        mx: 0 // Left aligned
      }}
    >
      <Stack direction="column" spacing={2}>

        {/* ─────────── Row 1 : column headers (Start / End) ─────────── */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={2}>
            <Checkbox
              checked={data.enabled}
              onChange={(e) => handle("enabled", e.target.checked)}
            />
          </Grid>
          <Grid item xs={6} sm={5}>
            <Typography variant="subtitle2">Start date</Typography>
          </Grid>
          <Grid item xs={6} sm={5}>
            <Typography variant="subtitle2">End date</Typography>
          </Grid>
        </Grid>

        {/* ─────────── Row 2 : two pickers ──────────────── */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={2}>
            {/* Empty space to align with checkbox above */}
          </Grid>
          <Grid item xs={12} sm={5}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                value={data.startDate}
                onChange={(d) => handle("startDate", d)}
                slotProps={{ textField: { fullWidth: true, size: "small" } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={5}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                value={data.endDate}
                onChange={(d) => handle("endDate", d)}
                slotProps={{ textField: { fullWidth: true, size: "small" } }}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>

        {/* ─────────── Row 3 : "Change / Between" labels ───────────── */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={2}>
            <Typography variant="subtitle2">Change</Typography>
          </Grid>
          <Grid item xs={6} sm={5}>
            <Typography variant="subtitle2">Between</Typography>
          </Grid>
          <Grid item xs={6} sm={5}>
            <Select
              fullWidth
              size="small"
              value={data.between}
              onChange={(e) => handle("between", e.target.value)}
            >
              {BETWEEN_TYPE_OPTIONS.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </Grid>
        </Grid>

        {/* ─────────── Row 4 : "Every" row ───────────── */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={2}>
            {/* Empty space */}
          </Grid>
          <Grid item xs={6} sm={5}>
            <Typography variant="body2">Every</Typography>
          </Grid>
          <Grid item xs={6} sm={5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Value (e.g. Monday / 1)"
              value={data.betweenValue}
              onChange={(e) => handle("betweenValue", e.target.value)}
            />
          </Grid>
        </Grid>

        {/* ─────────── Row 5 : Change type and "By" ───────────── */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={2}>
            <Select
              fullWidth
              size="small"
              value={data.onType}
              onChange={(e) => handle("onType", e.target.value)}
            >
              <MenuItem value="On Previous Value">On Previous Value</MenuItem>
              <MenuItem value="Independent">Independent</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={6} sm={5}>
            <Typography variant="body2">By</Typography>
          </Grid>
          <Grid item xs={6} sm={5}>
            <TextField
              fullWidth
              size="small"
              placeholder="+5+(A*B)  |  IF(A>2,100,0)"
              value={data.by}
              onChange={(e) => handle("by", e.target.value)}
            />
          </Grid>
        </Grid>

        {/* ─────────── Row 6 : (or) + Set-to constant ──────────────── */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={2}>
            <Typography variant="caption">(or)</Typography>
          </Grid>
          <Grid item xs={6} sm={5}>
            <Typography variant="body2">Set to</Typography>
          </Grid>
          <Grid item xs={6} sm={5}>
            <TextField
              fullWidth
              size="small"
              value={data.setTo}
              onChange={(e) => handle("setTo", e.target.value)}
            />
          </Grid>
        </Grid>

        {/* ─────────── Row 7 : helper text ─────────────── */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={2}>
            {/* Empty space */}
          </Grid>
          <Grid item xs={12} sm={10}>
            <Typography variant="caption" color="text.secondary">
              Accepted characters for "By": numbers, variable names, common
              operators (+ − * / ^), uncommon functions (Rem, Trunc, Round, ABS,
              Roundup, Rounddown), logical operators (AND, OR, NOT) and IF(,,).
            </Typography>
          </Grid>
        </Grid>

      </Stack>
    </Paper>
  );
}


const isRealChange = (panels) =>
  panels.some(
    (c) =>
      c.betweenValue &&                   // “Every …” filled
      (c.by || c.setTo) &&                // at least BY or SET-TO
      c.startDate && c.endDate            // both dates picked
  );

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

  const blankPanel = {
    enabled: false,
    startDate: null,
    endDate: null,
    between: BETWEEN_TYPE_OPTIONS[0],
    betweenValue: "",
    onType: "On Previous Value",
    by: "",
    setTo: "",
  };

  const [changes, setChanges] = useState(editMode ? [] : [blankPanel]);

  const updateChange = useCallback(
    (idx, patch) => setChanges((prev) => prev.map((c, i) => (i === idx ? patch : c))),
    []
  );

  const addChange = () => setChanges((prev) => [...prev, { ...blankPanel }]);

  useEffect(() => {
    if (!editMode) return;

    const vars = storage.getVariables();
    const v = vars[editIdx];

    if (!v) {
      enqueueSnackbar("Variable not found.", { variant: "error" });
      navigate("/variables");
      return;
    }
    setName(v.name);
    setDataType(v.datatype);
    setUnit(v.unit);
    setInitial(v.initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*────────────── 2.  Load prior *changes* for that variable ───────*/
  useEffect(() => {
    if (!editMode || !name) return;              // wait until meta loaded

    const raw = storage.getVariableChanges()
      .filter((c) => c.name === name)
      .sort(
        (a, b) =>
          parse(a.startDate, "dd MMM yy", new Date()) -
          parse(b.startDate, "dd MMM yy", new Date())
      );

    if (!raw.length) {
      setChanges([blankPanel]);
      return;
    }

    const panels = raw.map((c) => ({
      enabled: false, // unchecked by default
      startDate: parse(c.startDate, "dd MMM yy", new Date()),
      endDate: parse(c.endDate, "dd MMM yy", new Date()),
      between: c.between,
      betweenValue: c.betweenValue,
      onType: c.onType || "On Previous Value",
      by: c.by,
      setTo: c.setTo,
    }));
    setChanges(panels);
  }, [editMode, name]);

  const deleteChange = () => {
    const remaining = changes.filter((c) => !c.enabled);
    if (remaining.length === changes.length) {
      enqueueSnackbar("Tick the change(s) you want to delete.", {
        variant: "info",
      });
      return;
    }
    setChanges(remaining);

    const rebuild = remaining.map((c, i) => ({
      name,
      changeNo: i + 1,
      startDate: format(c.startDate, "dd MMM yy"),
      endDate: format(c.endDate, "dd MMM yy"),
      every: `${c.betweenValue} ${c.between}`,
      between: c.between,
      betweenValue: c.betweenValue,
      onType: c.onType,
      by: c.by,
      setTo: c.setTo,
    }));

    const untouched = storage
      .getVariableChanges()
      .filter((r) => r.name !== name);
    storage.saveVariableChanges([...untouched, ...rebuild]);
    storage.generateMasterTableFromVariableChanges(name);

    enqueueSnackbar("Selected change(s) deleted.", { variant: "success" });
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

  const createOrUpdateVariable = () => {
    if (!name.trim() || !dataType || !unit.trim() || initialValue === "") {
      enqueueSnackbar("All fields are required.", { variant: "error" });
      return false;
    }

    if (name.length > 15 || unit.length > 3) {
      enqueueSnackbar("Name ≤ 15 chars, Unit ≤ 3 chars", { variant: "warning" });
      return false;
    }

    const parsedInit =
      dataType === "integer" ? parseInt(initialValue) : parseFloat(initialValue);

    const newVar = { name, datatype: dataType, unit, initial: parsedInit, min: parsedInit, max: parsedInit };
    const vars = storage.getVariables();

    const duplicate = vars.some(
      (v, idx) => v.name === name && idx !== (editIdx ?? -1)
    );
    if (duplicate) {
      enqueueSnackbar("Name must be unique", { variant: "error" });
      return false;
    }

    let updatedVars;
    if (editMode) {
      const oldVar = vars[editIdx];
      updatedVars = [...vars];
      updatedVars[editIdx] = newVar;
      localStorage.setItem("selectedVariableIndex", editIdx);
      enqueueSnackbar("Variable updated", { variant: "success" });

      if (oldVar.name !== name) {
        storage.renameColumnInMaster(oldVar.name, name);
        const changes = storage.getVariableChanges();
        const patched = changes.map((c) =>
          c.variableName === oldVar.name ? { ...c, variableName: name } : c
        );
        storage.saveVariableChanges(patched);
      }

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
      updatedVars = [...vars, newVar];
      localStorage.setItem("selectedVariableIndex", updatedVars.length - 1);
      enqueueSnackbar("Variable created", { variant: "success" });
      storage.addColumnToMaster({ name, initial: parsedInit });
    }

    storage.saveVariables(updatedVars);
    return true;
  };

  const handleSubmit = () => {
    if (editMode) {
      if (saveChanges()) navigate("/variables");
    } else {
      const created = createOrUpdateVariable();
      if (!created) return;
      if (isRealChange(changes)) {
        const applied = saveChanges();
        if (!applied) return;
      }
      navigate("/variables");
    }
  };

  const saveChanges = () => {
    const fromLS = new Date(localStorage.getItem("fromDate"));
    const toLS = new Date(localStorage.getItem("toDate"));

    for (const c of changes) {
      if (!c.startDate || !c.endDate || !c.betweenValue) {
        enqueueSnackbar("All Change fields must be filled.", { variant: "error" });
        return false;
      }

      if (c.startDate < fromLS || c.endDate > toLS) {
        enqueueSnackbar("Start/End must lie within dashboard range.", { variant: "error" });
        return false;
      }

      if (c.onType === "On Previous Value" && +c.startDate === +fromLS) {
        enqueueSnackbar("Start must be after overall ‘From’ date.", { variant: "error" });
        return false;
      }

      if (!(c.by || c.setTo)) {
        enqueueSnackbar("Either BY or SET TO is required.", { variant: "error" });
        return false;
      }
    }

    const varName = name.trim();
    const prevChanges = storage.getVariableChanges();
    const nextChanges = [
      ...prevChanges.filter((r) => r.name !== varName),
      ...changes.map((c, i) => ({
        name: varName,
        changeNo: i + 1,
        startDate: format(c.startDate, "dd MMM yy"),
        endDate: format(c.endDate, "dd MMM yy"),
        every: `${c.betweenValue} ${c.between}`,
        between: c.between,
        betweenValue: c.betweenValue,
        onType: c.onType,
        by: c.by,
        setTo: c.setTo,
      })),
    ];
    storage.saveVariableChanges(nextChanges);
    storage.generateMasterTableFromVariableChanges(varName);
    enqueueSnackbar("Changes applied!", { variant: "success" });
    return true;
  };


  // ------------------------- UI ------------------------------
  return (
    <Grid container spacing={2} sx={{ p: 2 }}>
      {/* name */}
      <Grid item xs={12}>
        {/*          🡇  one on top of another  🡇 */}
        <Stack spacing={2} sx={{ minWidth: 420 }}>
          {/* Name */}
          <TextField
            label="Name"
            fullWidth
            value={name}
            inputProps={{ maxLength: 15 }}
            onChange={(e) => setName(e.target.value)}
            disabled={editMode /* not editable after creation */}
          />

          {/* Datatype */}
          <TextField
            label="Datatype"
            select
            fullWidth
            required
            value={dataType}
            onChange={(e) => setDataType(e.target.value)}
            disabled={editMode}
          >
            {dataTypes.map((d) => (
              <MenuItem key={d.value} value={d.value}>
                {d.label}
              </MenuItem>
            ))}
          </TextField>

          {/* Unit */}
          <TextField
            label="Unit"
            fullWidth
            required
            value={unit}
            inputProps={{ maxLength: 3 }}
            onChange={(e) => setUnit(e.target.value)}
            disabled={editMode}
          />

          {/* Initial value */}
          <TextField
            label="Initial value"
            fullWidth
            required
            value={initialValue}
            onChange={(e) => {
              const val = e.target.value;
              if (dataType === "integer") {
                if (/^\d*$/.test(val)) setInitial(val);
              } else {
                if (/^\d*\.?\d{0,2}$/.test(val)) setInitial(val);
              }
            }}
            inputProps={{
              inputMode: "decimal",
              step: dataType === "integer" ? "1" : "0.01",
            }}
            error={
              dataType === "integer"
                ? !/^\d+$/.test(initialValue) && initialValue !== ""
                : !/^\d+(\.\d{1,2})?$/.test(initialValue) && initialValue !== ""
            }
            helperText={
              initialValue !== "" &&
              (dataType === "integer"
                ? "Must be a whole number"
                : "Up to 2 decimal places")
            }
          />
        </Stack>
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

        <Box display="flex" justifyContent="space-between" mt={2} sx={{width: '75%'}}>
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
                handleSubmit
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
