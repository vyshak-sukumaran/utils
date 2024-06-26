import { useEffect, useRef, useState, forwardRef } from "react";
import "quill/dist/quill.snow.css";

var formats = [
  "background",
  "bold",
  "color",
  "font",
  "code",
  "italic",
  "link",
  "size",
  "strike",
  "script",
  "underline",
  "blockquote",
  "header",
  "indent",
  "list",
  "align",
  "direction",
  "code-block",
  "formula",
  // 'image'
  // 'video'
];
const quillOptions = {
  theme: "snow",
  modules: {
    toolbar: [
      [{ header: "1" }, { header: "2" }],
      [{ size: [] }],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [{ color: [] }, { background: [] }],
      [
        { list: "ordered" },
        { list: "bullet" },
        { indent: "-1" },
        { indent: "+1" },
      ],
      ["link"],
      ["clean"],
    ],
  },
  readOnly: true,
  formats: formats,
};

export const RichTextArea = forwardRef(function RTA(props, ref) {
  let {
    theme,
    value,
    onChange,
    onBlur = () => {},
    readOnly = false,
    limit,
    placeholder = "",
    width = 200,
    fullWidth = false,
    showCounter = false,
    error = false,
    noBorder = false,
    helperText = "",
    ...rest
  } = props;

  const [initialValueSet, setInitialValueSet] = useState(false);

  /**
   * @type {React.MutableRefObject<HTMLDivElement>}
   */
  const editorRef = useRef(null);
  /**
   * @type {React.MutableRefObject<HTMLDivElement>}
   */
  const containerRef = useRef(null);
  /**
   * @type {React.MutableRefObject<import("quill").Quill>}
   */
  let quillRef = useRef(null);

  width = fullWidth ? "w-full" : `w-[${width}px]`;

  useEffect(() => {
    const initializeQuill = async () => {
      if (!editorRef.current) return;
      const { default: Quill } = await import("quill");

      if (!quillRef.current) {
        quillRef.current = new Quill(editorRef.current, {
          ...quillOptions,
          placeholder: placeholder,
          readOnly: readOnly,
        });

        quillRef.current?.clipboard?.addMatcher("img", (_node, _delta) => {
          const Delta = Quill.import("delta");
          return new Delta().insert("");
        });
        quillRef.current?.clipboard?.addMatcher("picture", (_node, _delta) => {
          const Delta = Quill.import("delta");
          return new Delta().insert("");
        });
      }
      if (value && !initialValueSet) {
        const cursorPosition = quillRef.current?.getSelection()?.index;

        if (quillRef.current?.getLength() > 1) {
          quillRef.current?.setText("");
        }

        try {
          quillRef.current?.setContents(JSON.parse(value));
        } catch {
          quillRef.current?.setText(value);
        }

        if (cursorPosition !== undefined) {
          quillRef.current?.setSelection(cursorPosition, 0);
        }
        // Update the state variable to indicate that the initial value has been set
        setInitialValueSet(true);
      }
      try {
        const toolbar = quillRef.current?.getModule("toolbar");
        toolbar.addHandler("link", (value) => {
          const modal = document.querySelector(`div[data-modalBox="true"]`);
          if (value) {
            let urlLabel = document.createElement("span");
            urlLabel.textContent = "Enter link";
            let urlInput = document.createElement("input");
            urlInput.setAttribute("type", "text");
            urlInput.setAttribute("tabindex", "-1");
            let okButton = document.createElement("button");
            okButton.classList.add("ql-custom-prompt-ok-button");
            okButton.textContent = "OK";
            let cancelButton = document.createElement("button");
            cancelButton.textContent = "Cancel";

            let promptBoxBackdrop = document.createElement("div");
            promptBoxBackdrop.classList.add("ql-custom-prompt-box-backdrop");

            let promptBox = document.createElement("div");
            promptBox.classList.add("ql-custom-prompt-box");
            if (theme === "Dark") {
              promptBox.classList.add(theme);
            }

            promptBox.appendChild(urlLabel);
            promptBox.appendChild(urlInput);
            promptBox.appendChild(okButton);
            promptBox.appendChild(cancelButton);

            okButton.onclick = function () {
              console.log(document.activeElement);
              let url = urlInput.value;
              if (url) {
                quillRef.current?.format("link", url);
              }
              document.body?.removeChild(promptBox);
              document.body?.removeChild(promptBoxBackdrop);
              if (modal) {
                modal.setAttribute("tabIndex", "-1");
              }
            };

            cancelButton.onclick = function () {
              document.body?.removeChild(promptBox);
              document.body?.removeChild(promptBoxBackdrop);
              if (modal) {
                modal.setAttribute("tabIndex", "-1");
              }
            };

            document.body?.appendChild(promptBoxBackdrop);
            document.body?.appendChild(promptBox);
            if (modal) {
              modal.removeAttribute("tabIndex");
            }
          } else {
            try {
              quillRef.current?.format("link", false);
            } catch {}
          }
        });
      } catch (error) {
        console.log(error, "Quill Error");
        return;
      }
      const textChangeHandler = () => {
        if (limit && quillRef.current?.getLength() > limit) {
          quillRef.current?.deleteText(limit, quillRef.current?.getLength());
        }

        if (quillRef.current?.getLength() - 1 === 0) {
          onChange("");
        } else {
          onChange(JSON.stringify(quillRef.current?.getContents()));
        }
      };

      quillRef.current?.on("text-change", textChangeHandler);

      return () => {
        quillRef.current?.off("text-change", textChangeHandler);
      };
    };

    initializeQuill();
  }, [editorRef, quillRef, value, readOnly, onChange, initialValueSet, placeholder, limit, theme]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const toolbar = container.querySelector(".ql-toolbar");

    const containerFocusInHandler = () => {
      const qlToolbar = container.querySelector(".ql-toolbar");
      if (!qlToolbar) return;

      qlToolbar.style.opacity = 1;
      qlToolbar.style.zIndex = 1;

      const qlEditor = container.querySelector(".ql-editor");
      if (!qlEditor) return;

      const qlEditorHeight = qlEditor.getBoundingClientRect().height;
      const toolbarHeight = qlToolbar.getBoundingClientRect().height;
      qlEditor.style.minHeight = `calc(${qlEditorHeight}px - ${toolbarHeight}px)`;
      qlEditor.style.marginBottom = `${toolbarHeight}px`;
    };
    const containerFocusOutHandler = () => {
      onBlur();
      const qlToolbar = container.querySelector(".ql-toolbar");
      if (!qlToolbar) return;

      qlToolbar.style.opacity = 0;
      qlToolbar.style.zIndex = -1;

      const qlEditor = container.querySelector(".ql-editor");
      if (!qlEditor) return;
      const qlEditorHeight = qlEditor.getBoundingClientRect().height;
      const toolbarHeight = qlToolbar.getBoundingClientRect().height;
      const isBlank = qlEditor.classList.contains("ql-blank");
      const minHeight = isBlank
        ? "100px"
        : `calc(${qlEditorHeight}px + ${toolbarHeight}px)`;
      qlEditor.style.minHeight = minHeight;
      qlEditor.style.marginBottom = null;
    };
    container.addEventListener("focusin", containerFocusInHandler);
    container.addEventListener("focusout", containerFocusOutHandler);
    toolbar?.addEventListener("mousedown", (e) => {
      e.preventDefault();
    });
    return () => {
      container.removeEventListener("focusin", containerFocusInHandler);
      container.removeEventListener("focusout", containerFocusOutHandler);
      toolbar?.removeEventListener("mousedown", (e) => {
        e.preventDefault();
      });
    };
  }, [containerRef, onBlur]);

  const currentLength = quillRef.current
    ? quillRef.current?.getLength() - 1
    : 0;

  const border = noBorder
    ? ""
    : `border-[1px] focus-within:border-blue ${
        error
          ? "dark:border-[#f44336] border-[#d32f2f]"
          : "dark:border-slate-500 border-gray-300"
      }`;
  return (
    <div ref={ref} className="relative" onDrop={(e) => e.preventDefault()}>
      <div
        ref={containerRef}
        className={`ql-custom-wrapper ${theme} ${width} ${border} ${
          error && "ql-error"
        } relative min-h-[80px] flex flex-col-reverse rounded-md cursor-text`}
        {...rest}
      >
        <div ref={editorRef} className={`${theme}`}></div>
      </div>
      <div className="text-xs w-full">
        {helperText && (
          <div
            className={`${
              error
                ? "dark:text-[#f44336] text-[#d32f2f]"
                : "dark:text-gray-300 text-gray-500"
            } pt-1 ml-2 font-medium`}
          >
            {helperText}
          </div>
        )}
        {showCounter && (
          <span
            className={`ml-auto w-fit block mt-1 dark:text-slate-200 "dark:text-gray-300 text-gray-500"`}
          >
            {currentLength}/{limit}
          </span>
        )}
      </div>
    </div>
  );
});

export const RichTextAreaViewer = forwardRef(function RTAViewer(props, ref) {
  let {
    content = "",
    theme,
    fullWidth,
    width = 300,
    noBorder = false,
    ...rest
  } = props;
  const [initialValueSet, setInitialValueSet] = useState(false);
  width = fullWidth ? "w-full" : `w-[${width}px]`;
  /**
   * @type {React.MutableRefObject<HTMLDivElement>}
   */
  const editorRef = useRef(null);
  /**
   * @type {React.MutableRefObject<import("quill").Quill>}
   */
  let quillRef = useRef(null);

  useEffect(() => {
    const initializeQuill = async () => {
      if (!editorRef.current) return;
      const { default: Quill } = await import("quill");

      if (!quillRef.current) {
        quillRef.current = new Quill(editorRef.current, quillOptions);
      }

      if (content && !initialValueSet) {
        const cursorPosition = quillRef.current?.getSelection()?.index;

        if (quillRef.current?.getLength() > 1) {
          quillRef.current?.setText("");
        }

        try {
          quillRef.current?.setContents(JSON.parse(content));
        } catch {
          quillRef.current?.setText(content);
        }

        if (cursorPosition !== undefined) {
          quillRef.current?.setSelection(cursorPosition, 0);
        }
        // Update the state variable to indicate that the initial value has been set
        setInitialValueSet(true);
      }
    };
    initializeQuill();
  }, [editorRef, quillRef, content, initialValueSet]);

  const border = !noBorder
    ? `border-[1px] focus-within:border-blue dark:border-gray-500 border-gray-300`
    : "";
  return (
    <div ref={ref} className="relative">
      <div
        className={`ql-custom-wrapper ${theme} ${width} ${border} relative min-h-[80px] rounded-md cursor-text `}
        {...rest}
      >
        <div ref={editorRef} className={`${theme}`}></div>
      </div>
    </div>
  );
});
