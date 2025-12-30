import { HTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'
import styles from './Card.module.css'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'glass' | 'solid' | 'outline'
    padding?: 'none' | 'sm' | 'md' | 'lg'
    hover?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ children, variant = 'glass', padding = 'md', hover = false, className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={clsx(
                    styles.card,
                    styles[variant],
                    styles[`p-${padding}`],
                    hover && styles.hover,
                    className
                )}
                {...props}
            >
                {children}
            </div>
        )
    }
)

Card.displayName = 'Card'
