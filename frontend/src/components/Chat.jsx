import { useState, useEffect, useRef } from 'react';
import { messageAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const Chat = ({ selectedFriend, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const socket = useSocket();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (selectedFriend) {
      loadChatHistory();
    }
  }, [selectedFriend]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (socket) {
      socket.on('receive_message', (message) => {
        if (message.sender._id === selectedFriend._id) {
          setMessages((prev) => [...prev, message]);
        }
      });

      return () => {
        socket.off('receive_message');
      };
    }
  }, [socket, selectedFriend]);

  const loadChatHistory = async () => {
    setLoading(true);
    try {
      const response = await messageAPI.getChatHistory(selectedFriend._id);
      setMessages(response.data.messages);
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageContent = newMessage;
    setNewMessage('');

    if (socket) {
      socket.emit('send_message', {
        receiverId: selectedFriend._id,
        content: messageContent,
      });

      // Optimistically add message to UI
      const tempMessage = {
        _id: Date.now(),
        content: messageContent,
        sender: { _id: user?.id },
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, tempMessage]);
    }
  };

  if (!selectedFriend) {
    return (
      <div className="bg-white rounded-lg shadow p-6 flex items-center justify-center h-96">
        <p className="text-gray-500">Select a friend to start chatting</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow flex flex-col h-96">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            {selectedFriend.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{selectedFriend.name}</h3>
            {selectedFriend.isOnline && (
              <span className="text-xs text-green-500">● Online</span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-xl"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="text-center">Loading messages...</div>
        ) : (
          <>
            {messages.map((message) => {
              const isMyMessage = message.sender._id !== selectedFriend._id;
              return (
                <div
                  key={message._id}
                  className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      isMyMessage
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    <p>{message.content}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
