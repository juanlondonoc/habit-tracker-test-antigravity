import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'icon';
    isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center rounded-2xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:pointer-events-none active:scale-95 duration-200",
                    {
                        'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'primary',
                        'bg-card hover:bg-white/10 text-white border border-white/5': variant === 'secondary',
                        'hover:bg-white/10 text-white': variant === 'ghost',
                        'bg-destructive text-white hover:bg-destructive/90': variant === 'danger',
                        'h-10 px-4 py-2': size === 'md',
                        'h-8 px-3 text-sm': size === 'sm',
                        'h-10 w-10 p-0': size === 'icon',
                    },
                    className
                )}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
export { Button };
