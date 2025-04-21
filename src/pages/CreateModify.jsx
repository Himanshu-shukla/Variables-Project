import React, { useEffect, useState } from "react";
import {
  Grid, TextField, Typography, Button, MenuItem
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { useSnackbar } from "notistack";
import { storage } from "../utils/storage";

const dataTypes = [
  { label: "Decimal (2 float)", value: "decimal" },
  { label: "Integer",             value: "integer" },
  { label: "Percentage (2 float)",value: "percentage" },
];

export default function CreateModify() {
  const navigate        = useNavigate();
  const { state }       = useLocation();      // { mode, index }
  const { enqueueSnackbar } = useSnackbar();

  const editMode  = state?.mode === "edit";
  const editIdx   = editMode ? state.index : null;

  // ----------------------- form state -----------------------
  const [name, setName]             = useState("");
  const [dataType, setDataType]     = useState("decimal");
  const [unit, setUnit]             = useState("");
  const [initialValue, setInitial]  = useState("");

  // ---------- if editing, pre‑load the chosen variable -------
  useEffect(() => {
    if (!editMode) return;
    const vars = storage.getVariables();
    const v    = vars[editIdx];
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
    if (name.length > 15 || unit.length > 3) {
      enqueueSnackbar("Name ≤ 15 chars, Unit ≤ 3 chars", { variant: "warning" });
      return;
    }

    const newVar = {
      name,
      datatype: dataType,
      unit,
      initial: dataType === "integer" ? parseInt(initialValue) : parseFloat(initialValue),
      min: null,
      max: null,
    };

    const vars = storage.getVariables();

    // duplicate‑name check (ignore current row in edit mode)
    const duplicate = vars.some((v, idx) => v.name === name && idx !== (editIdx ?? -1));
    if (duplicate) {
      enqueueSnackbar("Name must be unique", { variant: "error" });
      return;
    }

    let updated;
    if (editMode) {
      updated        = [...vars];
      updated[editIdx] = newVar;
      localStorage.setItem("selectedVariableIndex", editIdx); // keep row selected
      enqueueSnackbar("Variable updated", { variant: "success" });
    } else {
      updated = [...vars, newVar];
      localStorage.setItem("selectedVariableIndex", updated.length - 1);
      enqueueSnackbar("Variable created", { variant: "success" });
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
          <Grid item xs={4}><Typography>Name</Typography></Grid>
          <Grid item xs={8}>
            <TextField
              fullWidth value={name}
              onChange={(e) => setName(e.target.value)}
              inputProps={{ maxLength: 15 }}
            />
          </Grid>
        </Grid>
      </Grid>

      {/* datatype */}
      <Grid item xs={12} sm={6}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item xs={4}><Typography>DataType</Typography></Grid>
          <Grid item xs={8}>
            <TextField
              select fullWidth value={dataType}
              onChange={(e) => setDataType(e.target.value)}
            >
              {dataTypes.map((d) => (
                <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Grid>

      {/* unit */}
      <Grid item xs={12} sm={6}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item xs={4}><Typography>Unit</Typography></Grid>
          <Grid item xs={8}>
            <TextField
              fullWidth value={unit}
              onChange={(e) => setUnit(e.target.value)}
              inputProps={{ maxLength: 3 }}
            />
          </Grid>
        </Grid>
      </Grid>

      {/* initial value */}
      <Grid item xs={12} sm={6}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item xs={4}><Typography>Initial Value</Typography></Grid>
          <Grid item xs={8}>
            <TextField
              fullWidth type="number"
              value={initialValue}
              onChange={(e) => setInitial(e.target.value)}
            />
          </Grid>
        </Grid>
      </Grid>

      {/* buttons */}
      <Grid item xs={12}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Button fullWidth variant="contained" onClick={handleSubmit}>
              Submit
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button fullWidth variant="outlined" onClick={() => navigate("/variables")}>
              Back
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}
