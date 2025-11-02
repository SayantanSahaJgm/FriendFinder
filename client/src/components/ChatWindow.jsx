import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { getMessages } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const ChatWindow = ({ friend, onClose, onCallStart }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadMessages();

    if (socket) {
      socket.on('receive-message', handleReceiveMessage);
      socket.on('message-sent', handleMessageSent);
    }

    return () => {
      if (socket) {
        socket.off('receive-message', handleReceiveMessage);
        socket.off('message-sent', handleMessageSent);
      }
    };
  }, [friend, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const res = await getMessages(friend._id);
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveMessage = (message) => {
    if (message.sender._id === friend._id) {
      setMessages((prev) => [...prev, message]);
    }
  };

  const handleMessageSent = (message) => {
    if (message.receiver._id === friend._id) {
      setMessages((prev) => [...prev, message]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    socket.emit('send-message', {
      receiverId: friend._id,
      content: newMessage,
    });

    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold">
            {friend.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-semibold">{friend.name}</h2>
            <p className="text-sm opacity-90">
              {friend.isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCallStart}
            className="bg-white text-blue-600 p-2 rounded hover:bg-gray-100"
            title="Start Call"
          >
            📞
          </button>
          <button
            onClick={onClose}
            className="bg-white text-blue-600 p-2 rounded hover:bg-gray-100"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="text-center text-gray-600">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-600">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              className={`flex ${
                message.sender._id === user._id ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender._id === user._id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <p>{message.content}</p>
                <p className="text-xs mt-1 opacity-75">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg disabled:bg-gray-400"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
