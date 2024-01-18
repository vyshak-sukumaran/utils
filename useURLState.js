import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { useCallback, useMemo } from "react";
/**
 * Single value type.
 * @typedef {(string|number|boolean|Array)} SingleValueType
 */
/**
 * Values type.
 * @typedef {Object.<string, SingleValueType>} ValuesType
 */
/**
 * URLState options.
 * @typedef {Object} URLStateOptions
 * @property {ValuesType} defaultValues - The default values for the url state.
 * @property {boolean} replace - For not setting browser history stack when changing the state.
 * @property {Array<string>} exclude - For excluding keys from the URL.
 */

/**
 * URLState result.
 * @typedef URLStateResult
 * @property {ValuesType} urlState
 * @property {ValuesType} modifiedValues
 * @property {boolean} isModified
 * @property {(keyStringOrObject: (string|ValuesType), value: SingleValueType=) => void} setURLState
 * @property {(defaultValues: ValuesType=) => void} reset
 * 
 */

/**
 * Custom hook for managing state in the URL.
 * @param {URLStateOptions} options - The options for the url state.
 * @returns {URLStateResult} An object containing properties to manage url state.
 */

export function useURLState(options) {

  // throw exception if options.defaultValues not provided
  if (!options.defaultValues) {
    throw new Error("defaultValues must be provided");
  }

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /**
 * Parses the given value based on the specified value type.
 *
 * @param {(string|Array<string>)} value - The value to be parsed.
 * @param {string} valueType - The type of the value.
 * @return {SingleValueType} The parsed value.
 */
  function parseValue(value, valueType) {
    switch (valueType) {
      case "string":
        return value;
      case "number":
        return Number(value);
      case "boolean":
        return value === "true";
      default:
        return value;
    }
  }

  const getURLState = useCallback(() => {
    let urlState = {};
    for (const key in options.defaultValues) {
      const defaultValue = options.defaultValues[key];
      const isArrayValues = Array.isArray(defaultValue);
      const valueType = typeof defaultValue;
      const value = !isArrayValues ? searchParams.get(key) : searchParams.getAll(key);
      urlState[key] = value ? parseValue(value, valueType) : options.defaultValues[key];
    }
    return urlState;

  }, [searchParams, options.defaultValues]);

  const urlState = getURLState();

  const isModified = useMemo(() => {
    const urlState = getURLState();
    return JSON.stringify(urlState) !== JSON.stringify(options.defaultValues);
  }, [options.defaultValues, getURLState]);

  const modifiedValues = useMemo(() => {
    const urlState = getURLState();
      let modifiedValues = {};
      Object.keys(urlState).forEach(key => {
        const isArray = Array.isArray(urlState[key]);
        const isModified = isArray ? urlState[key].join(",") !== options.defaultValues[key].join(",") : urlState[key] !== options.defaultValues[key];
        if (isModified) {
          modifiedValues[key] = urlState[key];
        }
      })
      return modifiedValues;
  }, [getURLState, options.defaultValues])

  
  const createQueryString = useCallback(
    (keyStringOrObject, value) => {
      if (!keyStringOrObject) return "";
      const newSearchParams = new URLSearchParams(searchParams);
      if (options?.exclude?.length) {
        options.exclude.forEach((excludeKey) => {
          newSearchParams.delete(excludeKey);
        });
      }
      const isValidKey = (key) => Object.keys(options.defaultValues).includes(key);

      const handleSearchParams = (params, key, value) => {
        if (!isValidKey(key)) return
        if (Array.isArray(value)) {
          const existingValues = params.getAll(key);
          if (existingValues.length) {
            params.delete(key);
          }
          value.forEach((val) => {
            params.append(key, String(val));
          })
    
        } else {
          params.set(key, String(value));
        }
      }

      if (typeof keyStringOrObject === "string") {
        handleSearchParams(newSearchParams, keyStringOrObject, value);
      } else {
        Object.keys(keyStringOrObject).forEach((key) => {
          handleSearchParams(newSearchParams, key, keyStringOrObject[key]);
        })
      }      
      return newSearchParams.toString();
    },
    [options.defaultValues, options.exclude, searchParams]
  );


  /**
   * Set the string value.
   *
   * @param {string} key - The key to set.
   * @param {SingleValueType} newValue - The new value to set.
   * @returns {void}
   */
  function setURLState(keyStringOrObject, newValue) {
    if (!keyStringOrObject) return
  
    let queryString;

    if (typeof keyStringOrObject === "object") {
      queryString = createQueryString(keyStringOrObject);
    } else if (typeof keyStringOrObject === "string") {
      queryString = createQueryString(keyStringOrObject, newValue);
    } else {
      throw new Error("keyStringOrObject must be a string or an object");
    }
    
    const pathToGo = `${pathname}?${queryString}`;

    if (options.replace) {
      router.replace(pathToGo);
      return;
    }
    router.push(pathToGo);
  }

  function reset(defaultValues) {
    const params = new URLSearchParams(searchParams);
    if (options?.exclude?.length) {
      options.exclude.forEach((excludeKey) => {
        params.delete(excludeKey);
      })
    }
    defaultValues = defaultValues || options.defaultValues;

    Object.keys(defaultValues).forEach(key => {
      const value = defaultValues[key];
      if (Array.isArray(value)) {
        params.delete(key);
        if (!value.length) return
        value.forEach((val) => {
          params.append(key, String(val));
        })
      } else {
        const isModifiedValue = value !== options.defaultValues[key];
        if (!isModifiedValue || !value) {
          params.delete(key);
          return
        }
        params.set(key, String(value));
      }

    })
    const finalParams = params.toString().length ? `?${params.toString()}` : "";
    router.push(`${pathname}${finalParams}`);
  }
  return { urlState, setURLState, isModified, modifiedValues, reset };
}
