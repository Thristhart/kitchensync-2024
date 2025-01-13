import classNames from "classnames";
import { ReactNode, useId } from "react";
import "./popover.css";

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
