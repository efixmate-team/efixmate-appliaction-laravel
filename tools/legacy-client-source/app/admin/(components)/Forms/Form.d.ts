import { ReactNode } from "react";

interface FormProps {
  showMe?: boolean;
  onSubmit?: (formData: FormData, values: Record<string, any>) => void | Promise<void>;
  onReset?: () => void;
  children: ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
  submitLabel?: string;
  resetLabel?: string;
  showReset?: boolean;
  submitAlign?: "left" | "right" | "center" | "full";
  loading?: boolean | string;
  card?: boolean;
  title?: string;
  subtitle?: string;
}

declare const Form: (props: FormProps) => JSX.Element;
export default Form;
