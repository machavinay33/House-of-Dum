import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { Spinner } from '@/components/ui/Spinner';

type Variant = 'gold' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export function buttonClasses(variant: Variant = 'gold', size: Size = 'md', extra = ''): string {
  return `btn btn-${variant} btn-${size} ${extra}`.trim();
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({ variant = 'gold', size = 'md', loading, className = '', children, disabled, ...rest }: ButtonProps) {
  return (
    <button className={buttonClasses(variant, size, className)} disabled={disabled || loading} {...rest}>
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}

interface RouterLinkButtonProps extends Omit<LinkProps, 'className'> {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

export function LinkButton({ variant = 'gold', size = 'md', className = '', children, ...rest }: RouterLinkButtonProps) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}

interface AnchorButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
  size?: Size;
}

export function AnchorButton({ variant = 'gold', size = 'md', className = '', children, ...rest }: AnchorButtonProps) {
  return (
    <a className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </a>
  );
}
