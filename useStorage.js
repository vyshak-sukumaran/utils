import {useCallback, useRef, useSyncExternalStore} from 'react';

// const StorageTypes = ['localStorage', 'sessionStorage', 'none']

const DefaultStorageType = 'localStorage';

function dispatchChangeEvent({ key, oldValue, newValue, storage }) {
  const event = document.createEvent("StorageEvent");
  event.initStorageEvent(
    "storage",
    false,
    false,
    key,
    oldValue,
    newValue,
    window.location.href,
    storage
  );
  window.dispatchEvent(event);
}

function getBrowserStorage(storageType = DefaultStorageType) {
  if (typeof window === "undefined") {
    throw new Error(
      "Browser storage is not available on Node.js/Docusaurus SSR process."
    );
  }
  if (storageType === "none") {
    return null;
  }
  try {
    return window[storageType];
  } catch (err) {
    logOnceBrowserStorageNotAvailableWarning(err);
    return null;
  }
}

let hasLoggedBrowserStorageNotAvailableWarning = false;

function logOnceBrowserStorageNotAvailableWarning(error) {
  if (!hasLoggedBrowserStorageNotAvailableWarning) {
    console.warn(
      `Docusaurus browser storage is not available.
  Possible reasons: running Docusaurus in an iframe, in an incognito browser session, or using too strict browser privacy settings.`,
      error
    );
    hasLoggedBrowserStorageNotAvailableWarning = true;
  }
}

const NoopStorageSlot = {
  get: () => null,
  set: () => {},
  del: () => {},
  listen: () => () => {},
};

// Fail-fast, as storage APIs should not be used during the SSR process
function createServerStorageSlot(key) {
  function throwError() {
    throw new Error(`Illegal storage API usage for storage key "${key}".
  Docusaurus storage APIs are not supposed to be called on the server-rendering process.
  Please only call storage APIs in effects and event handlers.`);
  }

  return {
    get: throwError,
    set: throwError,
    del: throwError,
    listen: throwError,
  };
}

export function createStorageSlot(key, options) {
  if (typeof window === "undefined") {
    return createServerStorageSlot(key);
  }
  const storage = getBrowserStorage(options?.persistence);
  if (storage === null) {
    return NoopStorageSlot;
  }
  return {
    get: () => {
      try {
        return storage.getItem(key);
      } catch (err) {
        console.error(`Storage error, can't get key=${key}`, err);
        return null;
      }
    },
    set: (newValue) => {
      try {
        const oldValue = storage.getItem(key);
        storage.setItem(key, newValue);
        dispatchChangeEvent({
          key,
          oldValue,
          newValue,
          storage,
        });
      } catch (err) {
        console.error(`Storage error, can't set ${key}=${newValue}`, err);
      }
    },
    del: () => {
      try {
        const oldValue = storage.getItem(key);
        storage.removeItem(key);
        dispatchChangeEvent({ key, oldValue, newValue: null, storage });
      } catch (err) {
        console.error(`Storage error, can't delete key=${key}`, err);
      }
    },
    listen: (onChange) => {
      try {
        const listener = (event) => {
          if (event.storageArea === storage && event.key === key) {
            onChange(event);
          }
        };
        window.addEventListener("storage", listener);
        return () => window.removeEventListener("storage", listener);
      } catch (err) {
        console.error(
          `Storage error, can't listen for changes of key=${key}`,
          err
        );
        return () => {};
      }
    },
  };
}

export function useStorageSlot(key, options) {
  // Not ideal but good enough: assumes storage slot config is constant
  const storageSlot = useRef(() => {
    if (key === null) {
      return NoopStorageSlot;
    }
    return createStorageSlot(key, options);
  }).current();

  const listen = useCallback(
    (onChange) => {
      // Do not try to add a listener during SSR
      if (typeof window === "undefined") {
        return () => {};
      }
      return storageSlot.listen(onChange);
    },
    [storageSlot]
  );

  const currentValue = useSyncExternalStore(
    listen,
    () => {
      // TODO this check should be useless after React 18
      if (typeof window === "undefined") {
        return null;
      }
      return storageSlot.get();
    },
    () => null
  );

  return [currentValue, storageSlot];
}

export function listStorageKeys(storageType = DefaultStorageType) {
  const browserStorage = getBrowserStorage(storageType);
  if (!browserStorage) {
    return [];
  }

  const keys = [];
  for (let i = 0; i < browserStorage.length; i += 1) {
    const key = browserStorage.key(i);
    if (key !== null) {
      keys.push(key);
    }
  }
  return keys;
}
