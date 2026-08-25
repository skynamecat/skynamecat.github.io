import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { question: string };
export function ConfirmButton({ question, onClick, ...props }: Props) {
  return <button {...props} onClick={(event) => {
    if (!window.confirm(question)) return;
    onClick?.(event);
  }} />;
}
