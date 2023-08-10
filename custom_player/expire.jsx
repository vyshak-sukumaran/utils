import React, { useEffect } from "react";

const Expire = ({ delay, visible, setVisible, children }) => {
  useEffect(() => {
    setTimeout(() => {
      setVisible(false);
    }, delay);
  }, [visible, delay]);

  return visible ? <>{children}</> : <div />;
};

export default Expire;
