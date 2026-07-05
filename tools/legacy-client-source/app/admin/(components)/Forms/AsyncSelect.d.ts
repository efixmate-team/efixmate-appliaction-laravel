import { ComponentProps, ElementType } from "react";

interface AsyncSelectProps {
  resource: string;
  filters?: Record<string, any>;
  labelKey?: string;
  valueKey?: string;
  /** Optional callback fired after options are loaded */
  onLoad?: (options: { id: any; label: string }[]) => void;
  name?: string;
  title?: string;
  value?: any;
  onChange?: (value: any) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  icon?: ElementType;
  /** Allow any other props to pass through to underlying Select */
  [key: string]: any;
}

declare const AsyncSelect: (props: AsyncSelectProps) => JSX.Element;
export default AsyncSelect;
