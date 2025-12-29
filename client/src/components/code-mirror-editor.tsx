// Replaced dynamic CodeMirror wrapper with a minimal, static textarea-only stub
import React from 'react';

interface Props {
  value?: string;
  onChange?: (val: string) => void;
  className?: string;
  placeholder?: string;
}

export default function CodeMirrorEditor({ value = '', onChange, className, placeholder }: Props) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className={className}
      spellCheck={false}
    />
  );
}
