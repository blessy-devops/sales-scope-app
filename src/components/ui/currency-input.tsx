import React from 'react';
import { NumericFormat } from 'react-number-format';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CurrencyInputProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onValueChange,
  placeholder = "0,00",
  className,
  id,
}) => {
  return (
    <NumericFormat
      customInput={Input}
      value={value}
      onValueChange={(values) => {
        onValueChange(values.value);
      }}
      thousandSeparator="."
      decimalSeparator=","
      prefix="R$ "
      decimalScale={2}
      allowNegative={false}
      placeholder={placeholder}
      className={cn(className)}
      id={id}
    />
  );
};