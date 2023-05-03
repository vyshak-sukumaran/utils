import { useDeferredValue, useEffect, useState } from "react";

export const useWindowSize = () => {
  const hasWindow = typeof window !== "undefined";
  const [windowSize, setWindowSize] = useState({
    height: hasWindow ? window.innerHeight : 0,
    width: hasWindow ? window.innerWidth : 0,
  });
  const deferred = useDeferredValue(windowSize);
  useEffect(() => {
    if (!hasWindow) return;
    function handleResize() {
      setWindowSize({
        height: window.innerHeight,
        width: window.innerWidth,
      });
    }
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return deferred;
};
