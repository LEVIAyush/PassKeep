// Native: PassKeep 1.x kept data in SQLite; that data is not migrated automatically.
export const readLegacy = () => ({ entries: [], rawCount: 0 });
export const clearLegacy = () => {};
