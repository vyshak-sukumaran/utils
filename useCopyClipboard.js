import { useState } from 'react'

export const useCopyClipboard = () => {
    const [toolTipTitle, setTollTipTitle] = useState("Copy");

  const copyToClipBoard = async (text) => {
    if ("clipboard" in navigator) {
      return await navigator.clipboard.writeText(text);
    } else {
      return document.execCommand("copy", true, text);
    }
  };
  const copyToClipBoardHandler = (value) => {
    if (!value) return
    copyToClipBoard(value)
      .then(() => {
        setTollTipTitle("Copied!");
        setTimeout(() => {
          setTollTipTitle("Copy");
        }, 1500);
      })
      .catch((err) => console.log(err));
  };
  return { toolTipTitle, copyToClipBoardHandler }
}
