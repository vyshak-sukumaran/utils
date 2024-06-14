import {
  ArrowUpTrayIcon,
  FolderIcon,
  PaperClipIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { IconButton } from "@mui/material";
import React, { Fragment, useRef, useState, forwardRef } from "react";
import { FILE_FORMATS, FILE_SIZE } from "../../utils";
import { Button } from "./button";
import PropTypes from "prop-types";

let acceptedFormats = FILE_FORMATS.split("/").flatMap((item) => [
  `.${item.toLowerCase()}`,
  `.${item.toUpperCase()}`,
]);
let formats = FILE_FORMATS.split("/").map((item) => `.${item.toLowerCase()}`);

export const extensionRegex = /(?:\.([^.]+))?$/;

export const getFileFormat = (fileName) =>
  fileName.match(extensionRegex)[1] ?? "";

const errMessages = {
  multiple: "Uploading multiple files are not currently available.",
  format: `Please upload files in formats "${formats.join()}"`,
  size: `The size limit of the attachment is ${FILE_SIZE ?? 10} MB. Reduce the file size and try again.`,
};

const additionalFormats = ",application/msword,application/vnd.ms-excel";
acceptedFormats = acceptedFormats.join() + additionalFormats;

export const FileUpload = forwardRef(function FileUpload(
  { value, setValue, buttonOnlyLayout = false, idPrefix = "", label = "" },
  ref
) {
  const uploaderID = `${idPrefix}upload-file-wt`
  const [isDragging, setIsDragging] = useState(false);
  const [errMsg, setErrMsg] = useState(null);
  const limitFileSize = false;
  const internalInputRef = useRef(null);
  /**
   * @type {React.RefObject<HTMLInputElement>}
   */
  const resolvedRef = ref || internalInputRef;

  const handleFiles = (f) => {
    const files = Array.from(f);
    if (!files.length) return;
    let newFiles = [];
    files.forEach((file) => {
      const fileName = file.name ?? "";
      const fileSize = file.size;
      const sizeToMB = Math.floor(fileSize / (1024 * 1024));
      let fileFormat = getFileFormat(fileName);
      fileFormat = fileFormat.toLowerCase() || "";
      const availableFormats = !FILE_FORMATS
        ? []
        : FILE_FORMATS?.toLowerCase()?.split("/");
      const availableFileSize = !FILE_SIZE ? 10 : FILE_SIZE;
      if (!availableFormats.includes(fileFormat)) {
        setErrMsg(errMessages.format);
        return;
      } else if (sizeToMB >= availableFileSize && limitFileSize) {
        setErrMsg(errMessages.size);
        return;
      } else {
        if (errMsg) setErrMsg(null);
        newFiles.push(file);
      }
    });
    const replaceIndex = resolvedRef.current.getAttribute("data-replace-index");

    setValue((prev) => {
      if (prev.length === 0) {
        return newFiles.slice(0, 5);
      } else {
        if (replaceIndex !== null) {
          const replaceIndexNum = parseInt(replaceIndex);
          prev[replaceIndexNum] = newFiles[0];
          resolvedRef.current.removeAttribute("data-replace-index");
        }

        let newArr = newFiles.filter((item) => {
          return !prev.some((val) => val.name === item.name);
        });
        return [...prev, ...newArr].slice(0, 5);
      }
    });
  };

  const isValidExtension = (files) => {
    if (!files.length) return false;
    for (const file of files) {
      if (!acceptedFormats.includes(getFileFormat(file.name))) {
        setErrMsg(errMessages.format);
        return false;
      }
    }
    return true;
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (
      e.target.files &&
      e.target.files[0] &&
      isValidExtension(e.target.files)
    ) {
      handleFiles(e.target.files);
    }
  };

  const handleButtonClick = () => {
    if (!resolvedRef.current) return;
    resolvedRef.current.click();
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (
      e.dataTransfer.files &&
      e.dataTransfer.files[0] &&
      isValidExtension(e.dataTransfer.files)
    ) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (fName) => {
    if (value.length === 0) return;
    let newFiles = value.filter((item) => item.name !== fName);
    setValue(newFiles);
  };

  const handleClear = () => {
    setErrMsg(null);
  };
  const handlePaste = (event) => {
    const items = (event.clipboardData || event.originalEvent.clipboardData)
      .items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf("image") !== -1) {
        const blob = item.getAsFile();
        let r = (Math.random() + 1).toString(36).substring(7);
        const file = new File([blob], `screenshot_${r}.png`, {
          type: "image/png",
          lastModified: Date.now(),
        });
        handleFiles([file]);
      }
    }
  };

  const ViewError = ({ errMsg }) => (errMsg &&
    <Fragment>
      <div
        className={`flex gap-2 items-center justify-center pt-2 text-red-500`}
      >
        <p className="text-sm">{errMsg}</p>
        <IconButton size="small" onClick={handleClear}>
          <XMarkIcon className="w-4 h-4 text-gray-500" />
        </IconButton>
      </div>
    </Fragment>
  );

  const ViewFilesList = ({ files, noMargin }) => (files && (
    <ul className={`list-none flex gap-2 flex-wrap ${!noMargin && "mt-2"}`}>
      {files?.map((item, index) => (
        <li key={item.name + index}>
          <div className="flex gap-1 items-center bg-sky bg-opacity-10 rounded-full p-1 pl-3 w-fit">
            <p className="text-sm max-w-[180px] text-gray-500 dark:text-slate-100 overflow-hidden whitespace-nowrap text-ellipsis">
              {item.name}
            </p>
            <IconButton size="small" onClick={() => handleRemoveFile(item.name)}>
              <XMarkIcon className="w-4 h-4 text-gray-500 dark:text-slate-100" />
            </IconButton>
          </div>
        </li>
      ))}
    </ul>
  ))

  const DragOverlay = ({ isDragging }) => (isDragging && (
    <div
      className="absolute inset-0 w-full h-full"
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    ></div>
  ))

  const MainContentSection = () => (
    <div className="flex flex-col justify-center items-center gap-2 text-gray-500">
      <ArrowUpTrayIcon className="w-10 h-10 text-gray-400" />
      <p className="text-gray-400">
        Drag and Drop files here
        {!limitFileSize ? "" : " (maximum {FILE_SIZE}MB)"}.
      </p>
      <div className="flex gap-2 items-center">
        <span>Or</span>
        <Button
          variant="contained"
          color="sky"
          startIcon={<FolderIcon className="text-white w-5 h-5" />}
          type="button"
          onClick={handleButtonClick}
        >
          Browse
        </Button>
      </div>
      <p className="text-sm text-gray-400">
        ( {"'Ctrl+V'"} to paste the copied content )
      </p>
    </div>
  )

  const FileInput = () => (
    <input
      ref={resolvedRef}
      type="file"
      onChange={handleChange}
      name={uploaderID}
      id={uploaderID}
      accept={acceptedFormats}
      hidden
    />
  )

  return !buttonOnlyLayout ? (
    <div
      className="border-[1px] p-2 rounded-md min-h-[150px] grow dark:border-gray-600 dark:hover:border-gray-500 border-gray-300 hover:border-gray-400">
      <div
        onDragEnter={handleDrag}
        onPaste={handlePaste}
        className={`border-2 relative rounded-md border-dashed p-5 w-full h-full flex flex-col gap-2 items-center justify-center transition-colors duration-200 ease-in-out ${isDragging && "bg-sky bg-opacity-10"
          } dark:border-slate-500 border-slate-400`}
      >
        <FileInput />
        <MainContentSection />
        <ViewError errMsg={errMsg} />
        <ViewFilesList files={value} />
        <DragOverlay isDragging={isDragging} />
      </div>
    </div>
  ) : (
    <div className="flex items-center gap-2 flex-wrap">
      <ViewFilesList files={value} noMargin />
      <div className="h-fit w-fit">
        <label htmlFor={uploaderID} className="flex gap-2 bg-blue p-[6px] pr-2 text-xs items-center rounded-full bg-opacity-10 text-blue dark:text-sky border-[1px] border-blue dark:border-sky hover:cursor-pointer">
          <PaperClipIcon className="w-4 h-4" />
          <span>{label}</span>
        </label>
        <FileInput />
      </div>
      <ViewError errMsg={errMsg} />
    </div>
  );
});

FileUpload.displayName = "FileUpload";

FileUpload.propTypes = {
  value: PropTypes.any,
  setValue: PropTypes.func.isRequired,
  buttonOnlyLayout: PropTypes.bool,
  idPrefix: PropTypes.string,
  label: PropTypes.string,
};
