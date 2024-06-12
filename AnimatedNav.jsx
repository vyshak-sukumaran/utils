import React from "react";
import { motion } from "framer-motion";
import PropTypes from "prop-types";

export const AnimatedNav = ({
  options,
  value,
  onChange,
  idPrefix,
  labelFormat = "{value}",
}) => {
  // for having dynamic labels for the nav items
  if (!String.prototype.format) {
    String.prototype.format = function (valueObj) {
      var str = this;
      for (var key in valueObj) {
        var regEx = new RegExp("{" + key + "}", "gm");
        str = str.replace(regEx, valueObj[key]);
      }
      return str;
    };
  }
  return (
    <nav className="flex gap-4 items-center">
      {options.map((item) => (
        <div key={item.value} className="h-fit w-fit text-slate-700">
          <input
            type="radio"
            value={item.value}
            checked={item.value === value}
            onChange={onChange}
            name={`${idPrefix}${item.value}`}
            id={`${idPrefix}${item.value}`}
            hidden
            className="peer"
          />
          <label
            htmlFor={`${idPrefix}${item.value}`}
            className="p-3 font-medium text-slate-500 dark:text-slate-300 text-sm block hover:cursor-pointer peer-checked:text-sky-or-purple relative "
          >
            <p dangerouslySetInnerHTML={{ __html: labelFormat.format(item) }} />
            {item.value === value && (
              <motion.div
                className="absolute bottom-0 left-0 w-full h-[2px] bg-sky-or-purple"
                layoutId="underline"
              />
            )}
          </label>
        </div>
      ))}
    </nav>
  );
};

AnimatedNav.propTypes = {
  options: PropTypes.array.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  idPrefix: PropTypes.string.isRequired,
  labelFormat: PropTypes.string.isRequired,
};
