import { ChangeEvent, ReactNode, ElementType } from "react";

interface SelectOption {
  id?: string | number;
  label?: string;
  value?: string | number;
  name?: string;
}

interface SelectProps {
  name?: string;
  title?: string;
  options?: SelectOption[];
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  submitCount?: number;
  icon?: ReactNode | ElementType | string;
}

declare const Select: (props: SelectProps) => JSX.Element;
export default Select;
