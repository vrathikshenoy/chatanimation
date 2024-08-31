'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Howl } from 'howler';

let sendSound = null;
let receiveSound = null;

const initializeSounds = () => {
  if (!sendSound) {
    sendSound = new Howl({
      src: ['/send.mp3'],
      volume: 1,
      onload: () => console.log('Send sound loaded successfully'),
      onloaderror: (id, error) => console.error('Error loading send sound:', error),
    });
  }
  if (!receiveSound) {
    receiveSound = new Howl({
      src: ['/receive.mp3'],
      volume: 1,
      onload: () => console.log('Receive sound loaded successfully'),
      onloaderror: (id, error) => console.error('Error loading receive sound:', error),
    });
  }
};

const SeenBy = ({ users, delay }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={`flex items-center space-x-2 mt-2 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      {users.map((user, index) => (
        <div
          key={index}
          className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-semibold"
        >
          {user[0]}
        </div>
      ))}
    </div>
  );
};

const ChatMessage = ({ message, isUser, onMessageDisplayed }) => {
  const [typing, setTyping] = useState(!isUser);

  useEffect(() => {
    if (!isUser) {
      const timer = setTimeout(() => {
        setTyping(false);
        onMessageDisplayed();
      }, 1500); // Adjust typing delay as needed
      return () => clearTimeout(timer);
    } else {
      onMessageDisplayed(); // Ensure message displayed callback is triggered for user messages
    }
  }, [isUser, onMessageDisplayed]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} mb-4`}
    >
      <span className="text-sm text-gray-500 mb-1">{message.user}</span>
      <div
        className={`rounded-3xl py-3 px-5 max-w-xs ${
          isUser ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : 'bg-gradient-to-r from-gray-600 to-gray-700 text-white'
        } shadow-lg`}
      >
        {typing ? (
          <div className="flex space-x-1">
            <motion.div
              className="w-2 h-2 bg-gray-400 rounded-full"
              animate={{ y: [0, -5, 0] }}
              transition={{
                repeat: Infinity,
                duration: 0.6,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className="w-2 h-2 bg-gray-400 rounded-full"
              animate={{ y: [0, -5, 0] }}
              transition={{
                repeat: Infinity,
                duration: 0.6,
                ease: 'easeInOut',
                delay: 0.4,
              }}
            />
            <motion.div
              className="w-2 h-2 bg-gray-400 rounded-full"
              animate={{ y: [0, -5, 0] }}
              transition={{
                repeat: Infinity,
                duration: 0.6,
                ease: 'easeInOut',
                delay: 0.5,
              }}
            />
          </div>
        ) : (
          <p>{message.text}</p>
        )}
      </div>
      {!isUser && (
        <SeenBy 
          users={['Raj', 'Shobitha', 'Hrishikesh','Kannika']} 
          delay={1.65}
        />
      )}
    </motion.div>
  );
};

const ChatInterface = () => {
  const [messages, setMessages] = useState([
    { text: 'arey ek news hai 🤠', isUser: false, user: 'Raj' },
    { text: 'kya hua 🤔', isUser: false, user: 'Shobitha' },
    { text: 'Nitte ka hackathon aya hai 🔥', isUser: false, user: 'Hrishikesh' },
    { text: 'website gajab ki hai 🤠', isUser: false, user: 'Kannika' },
  ]);
  const [visibleMessages, setVisibleMessages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [showReplyOptions, setShowReplyOptions] = useState(false);
  const [soundPlayed, setSoundPlayed] = useState({ send: false, receive: false });

  useEffect(() => {
    const handleUserInteraction = () => {
      if (!audioInitialized) {
        initializeSounds();
        setAudioInitialized(true);
        document.removeEventListener('click', handleUserInteraction);
      }
    };

    document.addEventListener('click', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
    };
  }, [audioInitialized]);

  useEffect(() => {
    if (currentIndex < messages.length) {
      const showNextMessage = () => {
        const message = messages[currentIndex];
        setVisibleMessages((prev) => [...prev, message]);
        setCurrentIndex(currentIndex + 1);

        // Reset sound played state
        setSoundPlayed({ send: false, receive: false });
      };

      const timer = setTimeout(showNextMessage, 2400);

      return () => clearTimeout(timer);
    } else {
      // All messages are displayed, show reply options
      setShowReplyOptions(true);
    }
  }, [currentIndex, messages]);

  const handleMessageDisplayed = useCallback(() => {
    const lastMessage = visibleMessages[visibleMessages.length - 1];
    
    if (lastMessage && !lastMessage.isUser && !soundPlayed.receive && receiveSound) {
      console.log('Playing receive sound');
      receiveSound.play();
      setSoundPlayed((prev) => ({ ...prev, receive: true }));
    }

    if (lastMessage && lastMessage.isUser && !soundPlayed.send && sendSound) {
      console.log('Playing send sound');
      sendSound.play();
      setSoundPlayed((prev) => ({ ...prev, send: true }));
    }
  }, [visibleMessages, soundPlayed]);

  useEffect(() => {
    handleMessageDisplayed();
  }, [visibleMessages, handleMessageDisplayed]);

  const addMessage = (text, isUser) => {
    const newMessage = { text, isUser, user: isUser ? 'You' : 'Unknown' };
    setMessages((prev) => [...prev, newMessage]);

    if (isUser) {
      setShowReplyOptions(false); // Hide options immediately after sending a message
    }
  };

  // Render reply options when all messages are displayed
  const renderReplyOptions = () => {
    const options = [
      'kya khaas kiya hai 😅?',
      'Lagta hai acha hai ehh 😎',
    ];

    return (
      <div className="flex space-x-4 justify-center py-4">
        {options.map((option, index) => (
          <button
            key={index}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4 py-2 transition-colors duration-300"
            onClick={() => addMessage(option, true)}
          >
            {option}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-grow overflow-hidden bg-gray-100 dark:bg-black text-gray-900 dark:text-white transition-colors duration-300">
        <div className="container mx-auto p-4 h-full flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-center flex-grow">
              Somewhere in India.
            </h1>
          </div>
          <div
            id="chat-container"
            className="flex-grow overflow-y-auto mb-4 space-y-2 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent"
          >
            <AnimatePresence>
              {visibleMessages.map((message, index) => (
                <ChatMessage
                  key={index}
                  message={message}
                  isUser={message.isUser}
                  onMessageDisplayed={handleMessageDisplayed}
                />
              ))}
            </AnimatePresence>
          </div>
          {showReplyOptions && renderReplyOptions()}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
