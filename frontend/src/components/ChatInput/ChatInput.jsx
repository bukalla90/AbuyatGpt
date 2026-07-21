import { useEffect, useRef, useState } from 'react';
import { Plus, Mic, ArrowUp } from 'lucide-react';
import styles from './ChatInput.module.css';

export default function ChatInput({ handleSendMessage, isLoading }) {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  useEffect(() => () => recognitionRef.current?.stop(), []);
  const toggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    if (isListening) { recognitionRef.current?.stop(); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = navigator.language || 'en-US';
    recognition.interimResults = true;
    recognition.onresult = event => setInput(Array.from(event.results).map(result => result[0].transcript).join(''));
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    handleSendMessage(input.trim());
    setInput('');
  };

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.icon}>
          <Plus size={20} />
        </div>
        <input
          type='text'
          className={styles.input}
          placeholder='Ask anything'
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={isLoading}
        />
        {input.trim() ? (
          <button
            type='submit'
            className={styles.submitBtn}
            disabled={isLoading}
          >
            <ArrowUp size={18} />
          </button>
        ) : (
          <>
            <div className={styles.icon}>
              <button type='button' className={`${styles.icon} ${isListening ? styles.listening : ''}`} onClick={toggleVoice} aria-label='Use voice input'><Mic size={20} /></button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
