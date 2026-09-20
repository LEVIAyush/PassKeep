import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { vaultCrypto, randomBytes } from '../crypto';
import { validateRecord, VaultError } from '../core/vaultCrypto.js';
import storage from '../platform/storage';
import { readLegacy, clearLegacy } from '../platform/legacy';

const VAULT_KEY = 'passkeep.vault.v1';
const SETTINGS_KEY = 'passkeep.settings.v1';
const DEFAULT_SETTINGS = { autoLockMinutes: 5 };

const VaultContext = createContext(null);
export const useVault = () => useContext(VaultContext);

const newId = () => Array.from(randomBytes(12), (b) => b.toString(16).padStart(2, '0')).join('');

// Coerce anything coming from a backup into the exact shape we expect.
function sanitizeEntry(e, now = Date.now()) {
  const created = Number(e.createdAt) || now;
  const updated = Number(e.updatedAt) || created;
  return {
    id: String(e.id || newId()),
    category: e.category === 'app' ? 'app' : 'browser',
    name: String(e.name || 'Untitled').slice(0, 200),
    username: String(e.username || '').slice(0, 500),
    password: String(e.password || '').slice(0, 1000),
    notes: String(e.notes || '').slice(0, 5000),
    favorite: !!e.favorite,
    createdAt: created,
    updatedAt: updated,
    passwordChangedAt: Number(e.passwordChangedAt) || updated,
  };
}

function parseBackupText(text) {
  let obj;
  try {
    obj = JSON.parse(String(text).trim());
  } catch {
    throw new VaultError('INVALID_BACKUP', 'That text is not a PassKeep backup.');
  }
  return validateRecord(obj);
}

export function VaultProvider({ children }) {
  const [status, setStatus] = useState('booting'); // booting | needsSetup | locked | unlocked
  const [entries, setEntries] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // Secrets live only in refs (memory). They are wiped on lock.
  const sessionRef = useRef(null); // { key, header }
  const entriesRef = useRef([]);
  const settingsRef = useRef(DEFAULT_SETTINGS);
  const queueRef = useRef(Promise.resolve());
  const idleTimer = useRef(null);

  // ---- lock / auto-lock -------------------------------------------------
  const lock = useCallback(() => {
    clearTimeout(idleTimer.current);
    if (!sessionRef.current) return;
    sessionRef.current = null;
    entriesRef.current = [];
    setEntries([]);
    setStatus('locked');
  }, []);

  const touch = useCallback(() => {
    if (!sessionRef.current) return;
    clearTimeout(idleTimer.current);
    const m = settingsRef.current.autoLockMinutes;
    if (m > 0) idleTimer.current = setTimeout(lock, m * 60000);
  }, [lock]);

  useEffect(() => {
    let hiddenAt = null;
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') {
        const m = settingsRef.current.autoLockMinutes;
        if (hiddenAt && sessionRef.current && m > 0 && Date.now() - hiddenAt >= m * 60000) lock();
        else touch();
        hiddenAt = null;
      } else if (hiddenAt == null) {
        hiddenAt = Date.now();
      }
    });
    return () => sub.remove();
  }, [lock, touch]);

  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    const onKey = () => touch();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [touch]);

  // ---- boot -------------------------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        const rawSettings = await storage.getItem(SETTINGS_KEY);
        if (rawSettings) {
          const s = { ...DEFAULT_SETTINGS, ...JSON.parse(rawSettings) };
          settingsRef.current = s;
          setSettings(s);
        }
      } catch { /* fall back to defaults */ }
      const raw = await storage.getItem(VAULT_KEY);
      setStatus(raw ? 'locked' : 'needsSetup');
    })();
    return () => clearTimeout(idleTimer.current);
  }, []);

  // If another tab changes the vault, drop our (now stale) session so we can
  // never overwrite newer data with older data.
  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    const onStorage = async (e) => {
      if (e.key !== VAULT_KEY && e.key !== null) return;
      sessionRef.current = null;
      entriesRef.current = [];
      setEntries([]);
      clearTimeout(idleTimer.current);
      const raw = await storage.getItem(VAULT_KEY);
      setStatus(raw ? 'locked' : 'needsSetup');
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // ---- write queue ------------------------------------------------------
  // All mutations run one at a time so rapid edits can't overwrite each other.
  const enqueue = useCallback((task) => {
    const p = queueRef.current.then(task, task);
    queueRef.current = p.catch(() => {});
    return p;
  }, []);

  const commit = useCallback(async (next) => {
    const s = sessionRef.current;
    if (!s) throw new Error('The vault is locked.');
    const record = await vaultCrypto.seal(s.key, s.header, { entries: next, savedAt: Date.now() });
    await storage.setItem(VAULT_KEY, JSON.stringify(record));
    entriesRef.current = next;
    setEntries(next);
  }, []);

  const startSession = useCallback((key, header, list) => {
    sessionRef.current = { key, header };
    entriesRef.current = list;
    setEntries(list);
    setStatus('unlocked');
    touch();
  }, [touch]);

  // ---- actions ----------------------------------------------------------
  const createVault = useCallback(async (masterPassword) => {
    const { entries: legacy, rawCount } = readLegacy();
    const now = Date.now();
    const list = legacy.map((l) => sanitizeEntry({ ...l, id: newId(), updatedAt: l.createdAt }, now));
    const { key, header, record } = await vaultCrypto.create(masterPassword, { entries: list });
    await storage.setItem(VAULT_KEY, JSON.stringify(record));
    // Only delete the old copy if every old record made it across.
    if (rawCount > 0 && legacy.length === rawCount) clearLegacy();
    startSession(key, header, list);
    return { imported: list.length };
  }, [startSession]);

  const unlock = useCallback(async (password) => {
    const raw = await storage.getItem(VAULT_KEY);
    if (!raw) { setStatus('needsSetup'); throw new VaultError('INVALID_BACKUP', 'No vault found.'); }
    const { key, header, vault } = await vaultCrypto.open(JSON.parse(raw), password);
    startSession(key, header, vault.entries.map((e) => sanitizeEntry(e)));
  }, [startSession]);

  const addEntry = useCallback((data) => enqueue(async () => {
    const now = Date.now();
    const entry = sanitizeEntry({ ...data, id: newId(), createdAt: now, updatedAt: now, passwordChangedAt: now }, now);
    await commit([...entriesRef.current, entry]);
    return entry;
  }), [enqueue, commit]);

  const updateEntry = useCallback((id, data) => enqueue(async () => {
    const now = Date.now();
    const next = entriesRef.current.map((e) => {
      if (e.id !== id) return e;
      const changedPw = data.password !== undefined && data.password !== e.password;
      return sanitizeEntry({ ...e, ...data, id, updatedAt: now, passwordChangedAt: changedPw ? now : e.passwordChangedAt }, now);
    });
    await commit(next);
  }), [enqueue, commit]);

  const deleteEntry = useCallback((id) => enqueue(() => commit(entriesRef.current.filter((e) => e.id !== id))), [enqueue, commit]);

  const toggleFavorite = useCallback((id) => enqueue(() => commit(
    entriesRef.current.map((e) => (e.id === id ? { ...e, favorite: !e.favorite } : e)),
  )), [enqueue, commit]);

  const changeMasterPassword = useCallback((current, next) => enqueue(async () => {
    const raw = await storage.getItem(VAULT_KEY);
    await vaultCrypto.open(JSON.parse(raw), current); // throws WRONG_PASSWORD if incorrect
    const { key, header, record } = await vaultCrypto.create(next, { entries: entriesRef.current });
    await storage.setItem(VAULT_KEY, JSON.stringify(record));
    sessionRef.current = { key, header };
  }), [enqueue]);

  const exportBackup = useCallback(async () => {
    const record = validateRecord(JSON.parse(await storage.getItem(VAULT_KEY)));
    return JSON.stringify({ app: 'passkeep', exportedAt: new Date().toISOString(), ...record }, null, 2);
  }, []);

  // Merge another backup into the unlocked vault (needs that backup's master password).
  const mergeBackup = useCallback((text, password) => enqueue(async () => {
    const record = parseBackupText(text);
    const { vault } = await vaultCrypto.open(record, password);
    const have = new Set(entriesRef.current.map((e) => e.id));
    const incoming = vault.entries.filter((e) => e && !have.has(String(e.id))).map((e) => sanitizeEntry(e));
    if (incoming.length) await commit([...entriesRef.current, ...incoming]);
    return { added: incoming.length, total: vault.entries.length };
  }), [enqueue, commit]);

  // Fresh install: adopt a backup as the vault (unlock with the backup's password).
  const restoreBackup = useCallback(async (text) => {
    const record = parseBackupText(text);
    await storage.setItem(VAULT_KEY, JSON.stringify(record));
    setStatus('locked');
  }, []);

  const eraseVault = useCallback(async () => {
    clearTimeout(idleTimer.current);
    sessionRef.current = null;
    entriesRef.current = [];
    setEntries([]);
    await storage.removeItem(VAULT_KEY);
    setStatus('needsSetup');
  }, []);

  const setAutoLock = useCallback(async (minutes) => {
    const s = { ...settingsRef.current, autoLockMinutes: minutes };
    settingsRef.current = s;
    setSettings(s);
    try { await storage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* non-fatal */ }
    touch();
  }, [touch]);

  const value = useMemo(() => ({
    status, entries, settings, touch, lock, createVault, unlock, addEntry, updateEntry, deleteEntry,
    toggleFavorite, changeMasterPassword, exportBackup, mergeBackup, restoreBackup, eraseVault, setAutoLock,
  }), [status, entries, settings, touch, lock, createVault, unlock, addEntry, updateEntry, deleteEntry,
    toggleFavorite, changeMasterPassword, exportBackup, mergeBackup, restoreBackup, eraseVault, setAutoLock]);

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}
