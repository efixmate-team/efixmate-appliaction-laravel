import { ChangeEvent, ReactNode, ElementType } from "react";

interface InputProps {
  name?: string;
  title?: string;
  placeholder?: string;
  icon?: ReactNode | ElementType | string;
  disabled?: boolean;
  type?: string;
  readonly?: boolean;
  validation?: string;
  value?: any;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  className?: string;
  submitCount?: number;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  autoComplete?: string;
  [key: string]: any;
}

declare const Input: (props: InputProps) => JSX.Element;
export default Input;
