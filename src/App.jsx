// const API_KEY = 'yxrcrWGiBpaREi9f3iVZ5j2M5AdZi7tE'; // Hugging Face API Key
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import './App.css';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);
  const isInitialLoad = useRef(true); // Track initial load

  useEffect(() => {
    const savedMessages = JSON.parse(localStorage.getItem('chatMessages')) || [];
    setMessages(savedMessages);
  }, []);

  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false; // Skip saving on initial load
      return;
    }
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  const clearChat = () => {
    localStorage.removeItem('chatMessages');
    setMessages([]);
  };

  const handleInput = () => {
    const textarea = textareaRef.current;
    textarea.style.height = 'auto';
    const maxHeight = 150;

    if (textarea.scrollHeight <= maxHeight) {
      textarea.style.overflowY = 'hidden';
      textarea.style.height = textarea.scrollHeight + 'px';
    } else {
      textarea.style.overflowY = 'auto';
      textarea.style.height = maxHeight + 'px';
    }
  };

  const API_KEY = 'yxrcrWGiBpaREi9f3iVZ5j2M5AdZi7tE'; // Hugging Face API Key

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await axios.post(
        'https://api.mistral.ai/v1/chat/completions',
        {
          model: 'mistral-small-latest',
          messages: [{ role: 'user', content: userMessage.text }],
        },
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const botMessage = {
        sender: 'bot',
        text: response.data.choices[0].message.content
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/`{1,3}([\s\S]*?)`{1,3}/g, '<code>$1</code>')
          .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
          .replace(/### (.*?)(\n|$)/g, '<h3>$1</h3>')
          .replace(/\n/g, '<br>'),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Error occurred. Please try again.', timestamp: new Date() },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chatbot-container">
      <div className='top-container' >
        <button className="clear-button" onClick={clearChat}>Clear Chat</button>
      </div>
      <div className="chat-window">
        <div className="messages-container">
          {messages.length === 0 && (
            <>
              <h1 style={{ color: 'white' }}>AI is waiting for your instructions...</h1>
              <div className="typing-indicator" style={{ color: 'white' }}>
                <span></span><span></span><span></span>
              </div>
            </>
          )}

          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`message-bubble ${msg.sender === 'user' ? 'user-message' : 'bot-message'}`}
            >
              <div className="message-text">
                {msg.text.split('\n').map((line, i) => (
                  <p key={i} dangerouslySetInnerHTML={{ __html: line }} />
                ))}
              </div>
              <div className="timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</div>
            </motion.div>
          ))}

          {isTyping && (
            <div className="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          )}

          <div ref={chatEndRef}></div>
        </div>

        <div className="input-container">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            // onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            onKeyDown={handleKeyDown}
            placeholder="Challenge me..."
            className="message-input"
            ref={textareaRef}
            onInput={handleInput}
          />
          <button onClick={sendMessage} className="send-button">Send</button>
        </div>
      </div>
    </div>
  );
}
