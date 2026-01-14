import { LabelHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
    ({ className, ...props }, ref) => {
        return (
            <label
                ref={ref}
                className={cn(
                    "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-400",
                    className
                )}
                {...props}
            />
        );
    }
);
Label.displayName = 'Label';

export { Label };
