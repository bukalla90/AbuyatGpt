import { ChevronDown, Menu } from 'lucide-react';
import styles from './ChatHeader.module.css';

export default function ChatHeader({ onMenu }) {
  return (
    <header className={styles.header}>
      <button className={styles.menuButton} onClick={onMenu} aria-label='Open navigation'>
        <Menu size={21} />
      </button>
      <div className={styles.left}>
        <span className={styles.brandMark}>✦</span><span>ChatGPT</span>
        <ChevronDown size={16} />
      </div>
      <div className={styles.right}>
        <div className={styles.avatar}>IT</div>
      </div>
    </header>
  );
}
