import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar/Sidebar'
import { Header } from './Header/Header'
import styles from './MainLayout.module.css'

export const MainLayout = () => {
    return (
        <div className={styles.container}>
            <Sidebar />
            <div className={styles.contentWrapper}>
                <Header />
                <main className={styles.main}>
                    <div className={styles.innerContent}>
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}
