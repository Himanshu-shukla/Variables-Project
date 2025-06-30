import React, { useEffect, useState } from "react";
import {
  Grid,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
  Paper,
  TableContainer,
  Button,
  Stack,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import { storage } from "../utils/storage";

export default function Variables() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // -------------------------------- state -------------------------------
  const [variables, setVariables] = useState([]);
  const [selectedIdx, setSelected] = useState(() => {
    const idx = Number(localStorage.getItem("selectedVariableIndex"));
    return Number.isInteger(idx) ? idx : 0;
  });

  // -------------------------- load / refresh list -----------------------
  useEffect(() => setVariables(storage.getVariables()), []);

  // ----------------------------- helpers --------------------------------
  const handleSelect = (idx) => {
    setSelected(idx);
    localStorage.setItem("selectedVariableIndex", idx);
  };

  const handleCreate = () => {
    if (variables.length >= 11) {
      enqueueSnackbar(
        "You already have 11 variables. Delete one before adding another.",
        { variant: "warning" }
      );
      return;
    }
    navigate("/create-modify", {
      state: { pageMode: "variable", mode: "create" },
    });
  };

  const handleModify = () => {
    if (!variables.length) return;
    navigate("/create-modify", {
      state: { pageMode: "variable", mode: "edit", editIdx: selectedIdx },
    });
  };

  const handleDelete = () => {
    if (!variables.length) return;

    const updated = variables.filter((_, i) => i !== selectedIdx);
    storage.saveVariables(updated); // persist
    setVariables(updated); // refresh list

    // fix selection
    const newIdx = updated.length
      ? Math.min(selectedIdx, updated.length - 1)
      : -1;
    setSelected(newIdx);
    localStorage.setItem("selectedVariableIndex", newIdx);

    enqueueSnackbar("Variable deleted", { variant: "info" });
  };

  // ---------------------------------------------------------------------
  return (
    <Stack direction="column" justifyContent="space-around" spacing={2} ml={2} sx={{ flex: 1, width: '100%', height: '100%', ml: 2 }}> 
      {/* Table Section */}
      <Grid item xs={12}>
        <Paper elevation={3} sx={{ borderRadius: 2 }}>
          <TableContainer sx={{ maxHeight: 400, overflowX: 'auto' }}>
            <Table size="small" aria-label="variables table">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell>Min</TableCell>
                  <TableCell>Max</TableCell>
                  <TableCell>Select</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {variables.map((v, i) => (
                  <TableRow key={i}>
                    <TableCell>{v.name}</TableCell>
                    <TableCell>{v.unit}</TableCell>
                    <TableCell>{v.min ?? '-'}</TableCell>
                    <TableCell>{v.max ?? '-'}</TableCell>
                    <TableCell>
                      <Checkbox
                        checked={selectedIdx === i}
                        onChange={() => handleSelect(i)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {!variables.length && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No variables found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>

      {/* Buttons Below Table, In a Row, Responsive */}
      <Stack direction="row" >
        <Grid container spacing={2} wrap="wrap" alignItems="center">
          <Grid item>
            <Button variant="contained" onClick={handleCreate}>
              Create
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              onClick={handleModify}
              disabled={!variables.length}
            >
              Modify
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              onClick={handleDelete}
              disabled={!variables.length}
            >
              Delete
            </Button>
          </Grid>
          <Grid item>
            <Button variant="contained" onClick={() => navigate('/')}>
              Back
            </Button>
          </Grid>
        </Grid>
      </Stack>
    </Stack>
  );
}
