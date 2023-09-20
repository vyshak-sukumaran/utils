import React, { useEffect, useRef, useState } from "react";

export const useIntersectionObserver = ({ threshold = 0, root = null, rootMargin = "0%", freezeOnceVisible = false }
) => {
    /** @type {React.MutableRefObject<HTMLElement>} */
    const ref = useRef(null)
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
    return { ref, isIntersecting };
};
