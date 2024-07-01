'use client';
import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import dayjs from 'dayjs';
import { FiSend } from 'react-icons/fi';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [typing, setTyping] = useState('');
  const [isNameValid, setIsNameValid] = useState(true);
  const socketRef = useRef();

  const validateName = (name) => {
    const regex = /^[A-Za-z\s]+$/;
    return regex.test(name);
  };

  const getInitials = (fullName) => {
    if (!fullName) return '';
    const names = fullName.trim().split(' ');
    if (names.length === 1) {
      return names[0][0];
    } else {
      return names[0][0] + names[1][0];
    }
  };

  const connectSocket = () => {
    socketRef.current = io();

    socketRef.current.emit('new-user', name);

    socketRef.current.on('chat-message', (data) => {
      setMessages((messages) => [
        ...messages,
        { text: `${data.name}: ${data.message}`, from: 'other', name: data.name, timestamp: dayjs().format('HH:mm:ss') }
      ]);
    });

    socketRef.current.on('user-connected', (name) => {
      setMessages((messages) => [
        ...messages,
        { text: `${name} se está conectando...`, from: 'system', timestamp: dayjs().format('HH:mm:ss') }
      ]);
    });

    socketRef.current.on('user-disconnected', (name) => {
      setMessages((messages) => [
        ...messages,
        { text: `${name} desconectado`, from: 'system', timestamp: dayjs().format('HH:mm:ss') }
      ]);
    });

    socketRef.current.on('user-typing', (name) => {
      setTyping(`${name} está escribiendo...`);
      setTimeout(() => setTyping(''), 2000);
    });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      socketRef.current.emit('send-chat-message', message);
      setMessages((messages) => [
        ...messages,
        { text: `Tú: ${message}`, from: 'self', name: 'Tú', timestamp: dayjs().format('HH:mm:ss') }
      ]);
      setMessage('');
    }
  };

  const handleModalSubmit = (e) => {
    e.preventDefault();
    if (validateName(name)) {
      setIsModalOpen(false);
      connectSocket();
    } else {
      setIsNameValid(false);
    }
  };

  useEffect(() => {
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const handleTyping = () => {
    socketRef.current.emit('typing', name);
  };

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName);
    setIsNameValid(validateName(newName));
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-200 p-4">
      <div className="w-full max-w-lg flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
              <h2 className="text-xl font-semibold mb-4">Ingresa tu nombre</h2>
              <form onSubmit={handleModalSubmit}>
                <input
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  className={`border p-2 mb-4 w-full rounded ${isNameValid ? 'border-gray-300' : 'border-red-500'}`}
                  placeholder="Tu nombre"
                  required
                />
                {!isNameValid && <p className="text-red-500 mb-4">El nombre solo puede contener letras y espacios.</p>}
                <button type="submit" className="bg-blue-500 text-white p-2 rounded w-full">Confirmar</button>
              </form>
            </div>
          </div>
        )}
        <div id="message-container" className="flex-grow p-4 space-y-4 overflow-auto bg-gray-50">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.from === 'self' ? 'justify-end' : 'justify-start'}`}>
              {msg.from !== 'self' && (
                <div className="bg-gray-300 text-black rounded-full w-8 h-8 flex items-center justify-center mr-2">
                  {getInitials(msg.name)}
                </div>
              )}
              <div
                className={`p-3 rounded-2xl max-w-xs break-words ${
                  msg.from === 'self' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black'
                }`}
              >
                <div className="text-xs text-white">{msg.timestamp}</div>
                <div>{msg.text}</div>
              </div>
            </div>
          ))}
          {typing && <div className="text-gray-500 text-sm">{typing}</div>}
        </div>
        <form onSubmit={sendMessage} className="flex items-center p-4 bg-white border-t border-gray-300">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleTyping}
            className="flex-grow p-2 border rounded-l-full focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="Escribe tu mensaje"
          />
          <button type="submit" className="bg-blue-500 text-white p-3 rounded-r-full hover:bg-blue-600 transition duration-200">
            <FiSend size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
