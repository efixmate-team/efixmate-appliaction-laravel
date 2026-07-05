import { FC } from "react";

interface FileUploadProps {
  title?: string;
  required?: boolean;
  error?: string;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  maxFiles?: number;
  value?: File | File[] | null;
  previewUrl?: string;
  onClearUrl?: () => void;
  onChange?: (file: File | File[] | null) => void;
  disabled?: boolean;
  className?: string;
  name?: string;
  id?: string;
  placeholder?: string;
}

declare const FileUpload: FC<FileUploadProps>;
export default FileUpload;
