import { ButtonHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'
import styles from './Button.module.css'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    fullWidth?: boolean
    loading?: boolean
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            children,
            variant = 'primary',
            size = 'md',
            fullWidth = false,
            loading = false,
            leftIcon,
            rightIcon,
            disabled,
            className,
            ...props
        },
        ref
    ) => {
        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                className={clsx(
                    styles.button,
                    styles[variant],
                    styles[size],
                    fullWidth && styles.fullWidth,
                    loading && styles.loading,
                    className
                )}
                {...props}
            >
                {loading && (
                    <span className={styles.spinner}>
                        <svg className="spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <circle
                                cx="8"
                                cy="8"
                                r="6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeDasharray="30 10"
                            />
                        </svg>
                    </span>
                )}
                {!loading && leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
                <span className={styles.content}>{children}</span>
                {!loading && rightIcon && <span className={styles.rightIcon}>{rightIcon}</span>}
            </button>
        )
    }
)

Button.displayName = 'Button'
