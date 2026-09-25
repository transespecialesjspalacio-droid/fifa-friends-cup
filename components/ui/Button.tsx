export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
  disabled?: boolean;
}

export function Button({ className, variant = "primary", size = "default", disabled, ...props }: ButtonProps) {
  const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible outline-none";

  const variantClasses = {
    default: "bg-surface-secondary text-foreground hover:bg-surface text-primary",
    primary: "bg-primary text-background hover:bg-primary/90",
    secondary: "bg-surface-secondary text-primary hover:bg-surface",
    ghost: "hover:bg-primary/5 text-primary rounded-lg",
  };

  const sizeClasses = {
    default: "h-10 px-4 py-2",
    sm: "h-8 px-3 py-1",
    lg: "h-12 px-6 py-3",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled}
      {...props}
    />
  );
}