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
            value={data.onType}
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
        {/* Row 7 – Delete button */}
        <Grid item xs={12}>
          <Box textAlign="right">
            <IconButton color="error" onClick={() => onDelete(idx)}>
              <DeleteIcon />
            </IconButton>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}

export default function CreateModify() {
  const navigate = useNavigate();
  const { state } = useLocation(); // { mode, index }
  const { enqueueSnackbar } = useSnackbar();

  const editMode = state?.mode === "edit";
  const editIdx = editMode ? state.index : null;

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
  const handleSubmit = () => {
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

    const integerValue =
      dataType === "integer"
        ? parseInt(initialValue)
        : parseFloat(initialValue);

    const newVar = {
      name,
      datatype: dataType,
      unit,
      initial: integerValue,
      min: integerValue,
      max: integerValue,
    };

    const vars = storage.getVariables();

    // duplicate‑name check (ignore current row in edit mode)
    const duplicate = vars.some(
      (v, idx) => v.name === name && idx !== (editIdx ?? -1)
    );
    if (duplicate) {
      enqueueSnackbar("Name must be unique", { variant: "error" });
      return;
    }

    let updated;
    if (editMode) {
      updated = [...vars];
      updated[editIdx] = newVar;
      localStorage.setItem("selectedVariableIndex", editIdx); // keep row selected
      enqueueSnackbar("Variable updated", { variant: "success" });
    } else {
      updated = [...vars, newVar];
      localStorage.setItem("selectedVariableIndex", updated.length - 1);
      enqueueSnackbar("Variable created", { variant: "success" });

      storage.addColumnToMaster({ name, initial: integerValue });
    }

    storage.saveVariables(updated);
    navigate("/variables");
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
          <Button variant="contained" onClick={addChange}>
            Add another change
          </Button>
          <Button variant="outlined" color="primary">
            Submit
          </Button>
        </Box>
      </Box>
      <Grid item xs={12}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Button fullWidth variant="contained" onClick={handleSubmit}>
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
