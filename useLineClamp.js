import { useEffect, useRef, useState } from "react";

export const useLineClamp = () => {
  /**
   * @type {React.MutableRefObject<HTMLElement>}
   */
  const ref = useRef(null)
  const [expanded, setExpanded] = useState(false);
  const [btnVisible, setBtnVisible] = useState(false);

  const toggleLineClamp = () => {
    setExpanded((prev) => !prev);
  };
  useEffect(() => {
    if (!ref.current) return;
    let elem = ref.current;
    if (elem.scrollHeight > elem.clientHeight) {
      setBtnVisible(true);
    }
  }, [ref]);
  return { ref, expanded, btnVisible, toggleLineClamp };
};
