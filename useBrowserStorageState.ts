import { useState, useEffect } from 'react';

function getStorageValue<T>(key: string, defaultValue: T, storage: Storage): T {
  // getting stored value
  const saved = storage.getItem(key);
  const initial: T | null = saved ? (JSON.parse(saved) as T) : null;
  return initial ?? defaultValue;
}

export const useBrowserStorageState = <T>(
  key: string,
  defaultValue: T,
  persistence: 'localStorage' | 'sessionStorage' = 'localStorage'
): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const storage =
    persistence === 'localStorage' ? localStorage : sessionStorage;
  const [value, setValue] = useState<T>(() =>
    getStorageValue(key, defaultValue, storage)
  );

  useEffect(() => {
    // storing input name
    storage.setItem(key, JSON.stringify(value));
  }, [key, value, storage]);

  return [value, setValue];
};
