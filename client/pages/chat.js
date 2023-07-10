// import { useState } from 'react';

// function Chat() {
//   const [messages, setMessages] = useState([]);
//   const [inputValue, setInputValue] = useState('');
//   const [isLoading, setLoading] = useState(false)

//   const handleInputChange = (e) => {
//     setInputValue(e.target.value);
//   };

//   const handleSendMessage = async () => {
//     event.preventDefault()
//     setLoading(true)
//     const text = inputValue
//     if (inputValue.trim() !== '') {
//       setMessages((preChatLog)=>[...preChatLog, {role:"user", content:inputValue}]);
//       setInputValue('');  
//     }
//     const response = await fetch(`http://localhost:8080/api/query?text=${text}`)
//     const data = await response.json()
//     setMessages((preChatLog)=>[...preChatLog, {role:"ai", content:data.message}]);
//     setLoading(false)
//   };

//   return (
//     <div className="min-h-screen flex flex-col justify-between">
//       <div className="flex-grow p-6 flex flex-col-reverse space-y-4">
//         <div>
//           {messages.map((message, index) => (
//             <div className={`flex ${message.role === "user" ? " justify-end" : " justify-start"}`} key={index}>
//               <div className={`${
//               message.role === 'user' ? 'bg-purple-500' : 'bg-gray-800'} rounded-lg p-4 text-white max-w-sm`}>
//                 {message.content}
//                 </div>
//             </div>
//           ))}
//         </div>
//       </div>
//       <div className="p-4">
//         <form onSubmit={handleSendMessage} className="flex">
//           <input
//             type="text"
//             value={inputValue}
//             onChange={handleInputChange}
//             placeholder="Type your message..."
//             className="flex-grow px-4 py-2 rounded-l-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//           <button
//             type='submit'
//             disabled={ inputValue<=0 ? true : false}
//             className="px-4 py-2 bg-blue-500 text-white rounded-r-lg disabled:bg-gray-600"
//           >
//             Send
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }

// export default Chat;


import { useState, useEffect } from "react";
import Head from 'next/head'
import Image from 'next/image'
import { Inter } from 'next/font/google'
import styles from '@/styles/Home.module.css'
import TypingAnimation from "./components/TypingAnimation";

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  const [inputValue, setInputValue] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();

    setChatLog((prevChatLog) => [...prevChatLog, { type: 'user', message: inputValue }])

    sendMessage(inputValue);
    
    setInputValue('');
  }

  const sendMessage = async (text) => {
    setIsLoading(true);

    const response = await fetch(`http://localhost:8080/api/query?text=${text}`)
    const data = await response.json()
    setChatLog((preChatLog)=>[...preChatLog, {type:"bot", message:data.message}]);
    setIsLoading(false)
  }

  return (
    <div className="container mx-auto max-w-[700px]">
      <div className="flex flex-col h-screen">
        <h1 className="bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text text-center py-3 font-bold text-6xl">Chat with Data</h1>
        <div className="flex-grow p-6">
          <div className="flex flex-col space-y-4">
          {
        chatLog.map((message, index) => (
          <div key={index} className={`flex ${
            message.type === 'user' ? 'justify-end' : 'justify-start'
            }`}>
            <div className={`${
              message.type === 'user' ? 'bg-purple-500' : 'bg-gray-800'
            } rounded-lg p-4 text-white max-w-sm`}>
            {message.message}
            </div>
            </div>
        ))
            }
            {
              isLoading &&
              <div key={chatLog.length} className="flex justify-start">
                  <div className="bg-gray-800 rounded-lg p-4 text-white max-w-sm">
                    <TypingAnimation />
                  </div>
              </div>
            }
      </div>
        </div>
        <form onSubmit={handleSubmit} className="flex-none p-6">
          <div className="flex rounded-lg border border-gray-700 bg-gray-800">  
        <input type="text" className="flex-grow px-4 py-2 bg-transparent text-white focus:outline-none" placeholder="Type your message..." value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
            <button type="submit" className="bg-purple-500 rounded-lg px-4 py-2 text-white font-semibold focus:outline-none hover:bg-purple-600 transition-colors duration-300">Send</button>
            </div>
        </form>
        </div>
    </div>
  )
}