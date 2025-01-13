import classNames from "classnames";
import { ReactNode, useId } from "react";
import "./popover.css";
import anchorPolyfill from "@oddbird/css-anchor-positioning/fn";

if (!("anchorName" in document.documentElement.style)) {
  anchorPolyfill();
}

interface PopoverProps {
  children: ReactNode;
  popoverContent: ReactNode;
  className?: string;
  popoverClassName?: string;
}
export function Popover(props: PopoverProps) {
  const popoverId = useId();
  return (
    <>
      <button popoverTarget={popoverId} className={props.className}>
        <span className="popoverAnchor">{props.children}</span>
      </button>
      <div
        className={classNames(props.popoverClassName, "popover")}
        id={popoverId}
        popover="auto"
      >
        {props.popoverContent}
      </div>
    </>
  );
}
