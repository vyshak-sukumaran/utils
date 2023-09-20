import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { useCallback } from "react";

/**
 * Custom hook for managing state in the URL.
 *
 * @param {string} key - A URL key to set as state.
 * @param {object} options - An object of options.
 * @param {any} options.defaultValue - The default value for the state.
 * @returns {[any, (newValue: any) => void]} - An array containing the state
 *                                             and its setter function.
 */
export function useURLState(key, options) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const URLStateType = typeof options.defaultValue;

  const initialValue = key ? searchParams.get(key) : undefined;
  const urlState = initialValue ? parseValue(initialValue, URLStateType) : options?.defaultValue;

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

  const createQueryString = useCallback(
    (value) => {
      if (!value) return "";
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set(key, value);
      return newSearchParams.toString();
    },
    [key, searchParams]
  );

  /**
   * Set the string value.
   *
   * @param {string} newValue - The new value to set.
   * @returns {void}
   */
  function setURLState(newValueOrCallback) {
    if (typeof newValueOrCallback === "function") {
        router.push(`${pathname}?${createQueryString(newValueOrCallback(urlState))}`)
        return
    }
    router.push(`${pathname}?${createQueryString(newValueOrCallback)}`);
  }

  return [urlState, setURLState];
}
