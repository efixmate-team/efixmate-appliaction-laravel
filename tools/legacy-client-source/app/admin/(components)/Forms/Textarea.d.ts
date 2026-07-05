import { ChangeEvent } from "react";

interface TextareaProps {
  title?: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  name?: string;
  id?: string;
  className?: string;
  rows?: number;
  maxLength?: number;
}

declare const Textarea: (props: TextareaProps) => JSX.Element;
export default Textarea;
