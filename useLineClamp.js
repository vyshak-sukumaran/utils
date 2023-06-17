import { useEffect, useState } from "react";

export const useLineClamp = (ref) => {
  const [expanded, setExpanded] = useState(false);
  const [btnVisible, setBtnVisible] = useState(false);

  const toggleLineClamp = () => {
    setExpanded((prev) => !prev);
  };
  useEffect(() => {
    if (!ref.current) return;
    let p = ref.current;
    if (p.scrollHeight > p.clientHeight) {
      setBtnVisible(true);
    }
  }, [ref]);
  return { expanded, btnVisible, toggleLineClamp };
};
