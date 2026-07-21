import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

import Sidebar from './components/Sidebar/Sidebar';
import ChatHeader from './components/ChatHeader/ChatHeader';
import MessageList from './components/MessageList/MessageList';
import ChatInput from './components/ChatInput/ChatInput';

import './App.css';



const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://abuyatgpt.onrender.com/api').replace(/\/$/, '');

const createId = () => crypto.randomUUID();

const getUserId = () => {
  const storedUserId = localStorage.getItem('abuyat-user-id');

  if (storedUserId) return storedUserId;

  const userId = createId();
  localStorage.setItem('abuyat-user-id', userId);
  return userId;
};

const getActiveChatId = () => {
  const storedChatId = localStorage.getItem('abuyat-active-chat-id');

  if (storedChatId) return storedChatId;

  const chatId = createId();
  localStorage.setItem('abuyat-active-chat-id', chatId);
  return chatId;
};


function App() {

  const [conversations, setConversations] = useState([]);

  const [isLoading, setIsLoading] = useState(false);

  // Keep the selected chat after a page refresh.
  const [chatId, setChatId] = useState(() => getActiveChatId());

  const [userId] = useState(() => getUserId());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messagesEndRef = useRef(null);



  // scroll to bottom
  const scrollToBottom = () => {

    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });

  };




  // auto scroll
  useEffect(() => {

    scrollToBottom();

  }, [conversations, isLoading]);


  // Load the saved chat whenever the page opens or a new chat is selected.
  useEffect(() => {
    let cancelled = false;

    const fetchConversations = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/chat/conversations`,
          { params: { chatId, userId } }
        );

        if (!cancelled && response.data.success) {
          setConversations(response.data.data);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error fetching conversations:', error);
          setConversations([]);
        }
      }
    };

    fetchConversations();

    return () => {
      cancelled = true;
    };
  }, [chatId, userId]);



  const handleNewChat = () => {
    const nextChatId = createId();
    localStorage.setItem('abuyat-active-chat-id', nextChatId);
    setChatId(nextChatId);
    setConversations([]);
    setSidebarOpen(false);
  };



  // send message
  const handleSendMessage = async (question) => {

    // optimistic user message
    const tempUserMessage = {
      id: Date.now(),
      role: 'user',
      content: question,
    };



    setConversations((prev) => [
      ...prev,
      tempUserMessage,
    ]);



    setIsLoading(true);



    try {

      const response = await axios.post(
        `${API_BASE_URL}/chat/conversations`,
        {
          question,
          chatId,
          userId,
        }
      );



      if (response.data.success) {

        const {
          userMessage,
          assistantMessage,
        } = response.data.data;



        // replace temp message
        setConversations((prev) => {

          const filtered = prev.filter(
            (msg) => msg.id !== tempUserMessage.id
          );



          return [
            ...filtered,
            userMessage,
            assistantMessage,
          ];
        });
      }

    } catch (error) {

      console.error(
        'Error posting conversation:',
        error
      );



      const errorMessage =
        error.response?.data?.message ||
        'There was an error generating a response.';



      const errorConversation = {
        id: Date.now() + 1,
        role: 'assistant',
        content: errorMessage,
      };



      setConversations((prev) => [
        ...prev,
        errorConversation,
      ]);

    } finally {

      setIsLoading(false);

    }
  };



  return (
    <div className='app'>

      <Sidebar onNewChat={handleNewChat} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />



      <main className='chat'>

        <ChatHeader onMenu={() => setSidebarOpen(true)} />



        <MessageList
          conversations={conversations}
          isLoading={isLoading}
          messagesEndRef={messagesEndRef}
        />



        <ChatInput
          handleSendMessage={handleSendMessage}
          isLoading={isLoading}
        />

      </main>

    </div>
  );
}



export default App;
