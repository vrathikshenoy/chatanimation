'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Howl } from 'howler';

// Initialize sounds only once
let sendSound = null;
let receiveSound = null;

const initializeSounds = () => {
  if (!sendSound) {
    sendSound = new Howl({
      src: ['/send.mp3'],
      volume: 1,
      preload: true,
      onload: () => console.log('Send sound loaded successfully'),
      onloaderror: (id, error) => console.error('Error loading send sound:', error),
    });
  }
  if (!receiveSound) {
    receiveSound = new Howl({
      src: ['/receive.mp3'],
      volume: 1,
      preload: true,
      onload: () => console.log('Receive sound loaded successfully'),
      onloaderror: (id, error) => console.error('Error loading receive sound:', error),
    });
  }
};

const SeenBy = React.memo(({ users }) => {
  const uniqueUsers = useMemo(() => {
    const userSet = new Set(users);
    return Array.from(userSet);
  }, [users]);

  return (
    <div className="flex -space-x-2 mt-1">
      {uniqueUsers.map((user, index) => (
        <motion.div
          key={user}
          className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-xs font-semibold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: index * 0.2 }}
        >
          {user[0]}
        </motion.div>
      ))}
    </div>
  );
});

const ChatMessage = React.memo(({ message, isUser, onMessageDisplayed, seenByUsers }) => {
  const [typing, setTyping] = useState(!isUser);
  const [fullyDisplayed, setFullyDisplayed] = useState(false);

  useEffect(() => {
    if (!isUser) {
      const typingTimer = setTimeout(() => {
        setTyping(false);
      }, 1000);

      const displayTimer = setTimeout(() => {
        setFullyDisplayed(true);
        onMessageDisplayed();
      }, 1200);

      return () => {
        clearTimeout(typingTimer);
        clearTimeout(displayTimer);
      };
    } else {
      setFullyDisplayed(true);
      onMessageDisplayed();
    }
  }, [isUser, onMessageDisplayed]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
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
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-gray-400 rounded-full"
                animate={{ y: [0, -5, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 0.9,
                  ease: 'easeInOut',
                  delay: i * 0.3,
                }}
              />
            ))}
          </div>
        ) : (
          <p>{message.text}</p>
        )}
      </div>
      {!isUser && fullyDisplayed && seenByUsers.length > 0 && (
        <SeenBy users={seenByUsers} />
      )}
    </motion.div>
  );
});

const ChatInterface = () => {
  const [messages, setMessages] = useState([
    { id: 1, text: 'arey ek news hai 🤠', isUser: false, user: 'Raj' },
    { id: 2, text: 'kya hua 🤔', isUser: false, user: 'Shobitha' },
    { id: 3, text: 'Nitte ka hackathon aya hai 🔥', isUser: false, user: 'Hrishikesh' },
    { id: 4, text: 'website gajab ki hai 🤠', isUser: false, user: 'Kannika' },
  ]);
  const [visibleMessages, setVisibleMessages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [showReplyOptions, setShowReplyOptions] = useState(false);
  const [soundPlayed, setSoundPlayed] = useState({ send: false, receive: false });
  const [seenByUsers, setSeenByUsers] = useState({});


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
        setVisibleMessages((prev) => [...prev, messages[currentIndex]]);
        setCurrentIndex((prevIndex) => prevIndex + 1);
        setSoundPlayed({ send: false, receive: false });
      };

      const timer = setTimeout(showNextMessage, 1800);

      return () => clearTimeout(timer);
    } else {
      setShowReplyOptions(true);
    }
  }, [currentIndex, messages]);

  const handleMessageDisplayed = useCallback(() => {
    const lastMessage = visibleMessages[visibleMessages.length - 1];

    if (lastMessage && !lastMessage.isUser && !soundPlayed.receive && receiveSound) {
      receiveSound.play();
      setSoundPlayed((prev) => ({ ...prev, receive: true }));
    }

    if (lastMessage && lastMessage.isUser && !soundPlayed.send && sendSound) {
      sendSound.play();
      setSoundPlayed((prev) => ({ ...prev, send: true }));
    }

    const seenByMap = {
      1: ['Kannika', 'Hrishikesh', 'Shobitha'], // Raj's message
      2: ['Raj', 'Kannika', 'Hrishikesh'], // Shobitha's message
      3: ['Shobitha', 'Kannika', 'Raj'], // Hrishikesh's message
      4: ['Hrishikesh', 'Shobitha', 'Raj'], // Kannika's message
    };

    if (lastMessage) {
      setSeenByUsers((prev) => ({
        ...prev,
        [lastMessage.id]: seenByMap[lastMessage.id] || [],
      }));
    }
  }, [visibleMessages, soundPlayed]);

  const addMessage = useCallback((text, isUser) => {
    const newMessage = { id: Date.now(), text, isUser, user: isUser ? 'You' : 'Unknown' };
    setMessages((prev) => [...prev, newMessage]);

    if (isUser) {
      setShowReplyOptions(false); // Hide reply options when the user sends a message
    }
  }, []);

  const renderReplyOptions = useMemo(() => {
    if (!showReplyOptions) return null;

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
  }, [showReplyOptions, addMessage]);

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-white transition-colors duration-300">
      <div className="flex-grow overflow-hidden">
        <div className="container mx-auto p-4 h-full flex flex-col">
          <div className="flex justify-center items-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold">
              Nitte Hackathon 👾
            </h1>
          </div>
          <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-blue-400">
            <AnimatePresence initial={false}>
              {visibleMessages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isUser={message.isUser}
                  onMessageDisplayed={handleMessageDisplayed}
                  seenByUsers={seenByUsers[message.id] || []}
                />
              ))}
            </AnimatePresence>
          </div>
          {renderReplyOptions}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
