import { useState, useEffect, useCallback } from 'react';
import { storage } from '../utils/storage';

export default function useVariables() {
  const [variables, setVariables] = useState(storage.getVariables());

  // keep React state <-> localStorage in sync
  useEffect(() => storage.saveVariables(variables), [variables]);

  // simple CRUD -------------------------------------------------
  const addVariable = useCallback((v) => setVariables((prev) => [...prev, v]), []);
  const removeVariable = useCallback(
    (id) => setVariables((prev) => prev.filter((v) => v.id !== id)),
    []
  );
  const updateVariable = useCallback(
    (id, patch) =>
      setVariables((prev) =>
        prev.map((v) => (v.id === id ? { ...v, ...patch } : v))
      ),
    []
  );

  return { variables, addVariable, removeVariable, updateVariable };
}
