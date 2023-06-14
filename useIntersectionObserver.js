import React, { useEffect, useState } from "react";

/** @param {React.MutableRefObject<HTMLDivElement>} ref */
export const useIntersectionObserver = (
  ref,
  { threshold = 0, root = null, rootMargin = "0%", freezeOnceVisible = false }
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const frozen = isIntersecting && freezeOnceVisible;

  /** @param {IntersectionObserverEntry[]} [entry] */
  const updateObserver = ([entry]) => {
    setIsIntersecting(entry?.isIntersecting);
  };
  useEffect(() => {
    const node = ref?.current;
    const hasIOSupport = !!window.IntersectionObserver;

    if (!hasIOSupport || frozen || !node) return;

    const observerParams = { threshold, root, rootMargin };
    const observer = new IntersectionObserver(updateObserver, observerParams);

    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [ref?.current, JSON.stringify(threshold), root, rootMargin, frozen]);
  return { isIntersecting };
};
