
import React, { memo, useState } from 'react';

// --- Icon Button with Tooltip ---
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  tooltip: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

const iconButtonVariants = {
  default: 'text-slate-500 hover:text-slate-700 hover:bg-slate-100',
  primary: 'text-slate-500 hover:text-cyan-600 hover:bg-cyan-50',
  success: 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50',
  warning: 'text-slate-500 hover:text-amber-600 hover:bg-amber-50',
  danger: 'text-slate-500 hover:text-red-600 hover:bg-red-50',
  info: 'text-slate-500 hover:text-blue-600 hover:bg-blue-50',
};

const iconButtonSizes = {
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-2.5',
};

export const IconButton: React.FC<IconButtonProps> = memo(({
  icon,
  tooltip,
  variant = 'default',
  size = 'md',
  className = '',
  disabled,
  ...props
}) => {
  return (
    <button
      className={`
        relative group rounded-lg transition-all duration-150
        ${iconButtonVariants[variant]}
        ${iconButtonSizes[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      disabled={disabled}
      title={tooltip}
      {...props}
    >
      {icon}
      {/* Tooltip */}
      <span className="
        absolute -top-9 left-1/2 -translate-x-1/2 
        bg-slate-900 text-white text-xs font-medium
        px-2.5 py-1.5 rounded-md
        opacity-0 group-hover:opacity-100 
        transition-opacity duration-150
        whitespace-nowrap pointer-events-none
        z-50 shadow-lg
        before:content-[''] before:absolute before:top-full before:left-1/2 
        before:-translate-x-1/2 before:border-4 before:border-transparent 
        before:border-t-slate-900
      ">
        {tooltip}
      </span>
    </button>
  );
});

IconButton.displayName = 'IconButton';

// --- Loading Skeleton ---
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

// --- Badge ---
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'light' | 'dark';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = memo(({ children, variant = 'secondary', className = '' }) => {
  const colors = {
    primary: 'bg-primary text-white',
    secondary: 'bg-secondary text-white',
    success: 'bg-success text-white',
    warning: 'bg-warning text-textDark',
    danger: 'bg-danger text-white',
    info: 'bg-info text-textDark',
    light: 'bg-bgLight text-textDark border border-borderColor',
    dark: 'bg-textDark text-white',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[variant]} ${className}`}>
      {children}
    </span>
  );
});

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = memo(({ children, variant = 'primary', size = 'md', isLoading = false, className = '', ...props }) => {
  const baseStyle = "inline-flex items-center justify-center font-medium rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-hover focus:ring-primary shadow-sm",
    secondary: "bg-secondary text-white hover:opacity-90 focus:ring-secondary shadow-sm",
    danger: "bg-danger text-white hover:bg-red-700 focus:ring-danger shadow-sm",
    outline: "border border-borderColor text-textDark bg-white hover:bg-bgLight focus:ring-primary",
    ghost: "text-textMuted hover:bg-bgLight hover:text-textDark",
    success: "bg-success text-white hover:bg-green-600 focus:ring-success shadow-sm",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm h-8",
    md: "px-4 py-2 text-sm h-10",
    lg: "px-6 py-3 text-base h-12",
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} disabled={isLoading || props.disabled} {...props}>
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </>
      ) : children}
    </button>
  );
});

// --- Card ---
interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', noPadding = false }) => {
  return (
    <div className={`bg-white rounded-md border border-borderColor shadow-sm overflow-hidden ${className}`}>
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>
    </div>
  );
};

// --- EmptyState ---
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action, className = '' }) => {
  return (
    <div className={`py-12 px-4 text-center ${className}`}>
      {icon && (
        <div className="w-16 h-16 bg-bgLight rounded-full flex items-center justify-center mx-auto mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-textDark mb-2">{title}</h3>
      {description && (
        <p className="text-textMuted mb-6 max-w-sm mx-auto">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
};

// --- Tooltip ---
interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-textDark border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-textDark border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-textDark border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-textDark border-y-transparent border-l-transparent',
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute ${positionClasses[position]} px-2 py-1 text-xs font-medium text-white bg-textDark rounded whitespace-nowrap z-50`}>
          {content}
          <div className={`absolute border-4 ${arrowClasses[position]}`}></div>
        </div>
      )}
    </div>
  );
};

// --- Common Input Styles ---
const inputBaseStyles = "block w-full rounded-md border border-borderColor px-3 py-2.5 text-textDark placeholder-gray-400 bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:text-sm transition-all";
const labelStyles = "block text-sm font-medium text-textDark mb-1.5";
const errorStyles = "border-danger focus:border-danger focus:ring-danger/20";

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = memo(({ label, helperText, error, className = '', ...props }) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className={labelStyles}>
          {label} {props.required && <span className="text-danger">*</span>}
        </label>
      )}
      <input
        className={`${inputBaseStyles} ${error ? errorStyles : ''}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
      {helperText && !error && <p className="mt-1.5 text-xs text-textMuted">{helperText}</p>}
    </div>
  );
});

// --- Select ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    helperText?: string;
    error?: string;
    options: { value: string | number; label: string }[];
}

export const Select: React.FC<SelectProps> = memo(({ label, helperText, error, options, className = '', ...props }) => {
    return (
        <div className={`mb-4 ${className}`}>
            {label && (
                <label className={labelStyles}>
                    {label} {props.required && <span className="text-danger">*</span>}
                </label>
            )}
            <select
                className={`${inputBaseStyles} ${error ? errorStyles : ''}`}
                {...props}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
            {helperText && !error && <p className="mt-1.5 text-xs text-textMuted">{helperText}</p>}
        </div>
    );
});

// --- Table ---
interface TableProps {
  headers: string[];
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({ headers, children, className = '' }) => {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-borderColor">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            {headers.map((h, i) => (
              <th key={i} scope="col" className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-borderColor">
          {children}
        </tbody>
      </table>
    </div>
  );
};

export const TableRow: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <tr className={`hover:bg-bgLight transition-colors ${className}`}>
    {children}
  </tr>
);

export const TableCell: React.FC<{ children: React.ReactNode; className?: string; align?: 'left' | 'right' | 'center' }> = ({ children, className = '', align = 'left' }) => {
  const alignment = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <td className={`px-6 py-4 whitespace-nowrap text-sm text-textDark ${alignment} ${className}`}>
      {children}
    </td>
  );
};
