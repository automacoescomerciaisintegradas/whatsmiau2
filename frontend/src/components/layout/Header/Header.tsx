import { Search, Bell, Moon, Sun, Monitor, HelpCircle } from 'lucide-react'
import styles from './Header.module.css'
import { clsx } from 'clsx'

export const Header = () => {
    return (
        <header className={clsx(styles.header, 'glass')}>
            <div className={styles.search}>
                <Search size={18} className={styles.searchIcon} />
                <input
                    type="text"
                    placeholder="Buscar no WhatsMiau..."
                    className={styles.searchInput}
                />
                <div className={styles.searchCommand}>⌘K</div>
            </div>

            <div className={styles.actions}>
                <button className={styles.actionBtn}>
                    <HelpCircle size={20} />
                </button>
                <button className={styles.actionBtn}>
                    <Monitor size={20} />
                    <span className={styles.badge}>ON</span>
                </button>
                <button className={styles.actionBtn}>
                    <Bell size={20} />
                    <span className={styles.dot}></span>
                </button>

                <div className={styles.themeToggle}>
                    <button className={clsx(styles.themeBtn, styles.active)}>
                        <Moon size={18} />
                    </button>
                    <button className={styles.themeBtn}>
                        <Sun size={18} />
                    </button>
                </div>

                <div className={styles.divider}></div>

                <div className={styles.user}>
                    <div className={styles.userInfo}>
                        <span className={styles.userName}>Pc Admin</span>
                        <span className={styles.userRole}>Administrador</span>
                    </div>
                    <div className={styles.avatar}>
                        <img src="https://ui-avatars.com/api/?name=Pc+Admin&background=6366f1&color=fff" alt="Avatar" />
                    </div>
                </div>
            </div>
        </header>
    )
}
