// frontend/src/components/ChatSection.js
import React, { useState, useRef, useEffect } from 'react';

const ChatSection = ({ recordings }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "Hi! I'm your AI life assistant. I can help you remember things from your recordings. Try asking me about your tasks, appointments, or anything you've mentioned!",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    const question = inputText.trim();
    if (!question || isLoading) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: question,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('https://ai-life-assistant-api-production.up.railway.app/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question })
      });

      if (response.ok) {
        const data = await response.json();
        
        const aiMessage = {
          id: Date.now() + 1,
          sender: 'ai',
          text: data.response,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        text: "Sorry, I'm having trouble connecting to my brain right now. Please try again in a moment!",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions = [
    "What tasks do I need to do?",
    "Who did I meet recently?",
    "What appointments do I have?",
    "Show me my shopping list",
    "What did I say about Bob?",
    "Any family events coming up?"
  ];

  const askQuickQuestion = (question) => {
    setInputText(question);
    setTimeout(() => sendMessage(), 100);
  };

  return (
    <div className="chat-section">
      <h2 className="section-title">
        🤖 Ask Your AI Assistant
      </h2>
      
      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.sender}`}>
            <div className="message-content">
              {message.text}
            </div>
            <div className="message-timestamp">
              {message.timestamp.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message ai loading-message">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              Thinking...
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="quick-questions">
        <p>Quick questions:</p>
        <div className="quick-buttons">
          {quickQuestions.map((question, index) => (
            <button
              key={index}
              className="quick-btn"
              onClick={() => askQuickQuestion(question)}
              disabled={isLoading}
            >
              {question}
            </button>
          ))}
        </div>
      </div>
      
      <div className="chat-input-area">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me anything about your recordings..."
          className="chat-input"
          disabled={isLoading}
          rows="2"
        />
        
        <button
          onClick={sendMessage}
          disabled={!inputText.trim() || isLoading}
          className="send-btn"
        >
          {isLoading ? '⏳ Thinking...' : '📤 Ask'}
        </button>
      </div>
      
      <div className="chat-stats">
        <small>
          {recordings.length} memories • {messages.filter(m => m.sender === 'user').length} questions asked
        </small>
      </div>
    </div>
  );
};

export default ChatSection;