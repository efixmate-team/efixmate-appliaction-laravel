interface ToggleProps {
  name?: string;
  title?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (value: boolean) => void;
  disabled?: boolean;
  className?: string;
  submitCount?: number;
  label?: string;
  description?: string;
}

declare const Toggle: (props: ToggleProps) => JSX.Element;
export default Toggle;
