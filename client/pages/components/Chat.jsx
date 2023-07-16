import { useState, useEffect } from "react";
import { Inter } from 'next/font/google'
import styles from '@/styles/Home.module.css'
import TypingAnimation from "./TypingAnimation";
import Link from "next/link";
import Navbar from "./Navbar";

const inter = Inter({ subsets: ['latin'] })

export default function Chat() {
  const [inputValue, setInputValue] = useState("");
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
    <div className="container mx-auto">
    <div className="fixed left-0 top-0">
    {/* <svg fill="#000000" height="200px" width="200px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 219.151 219.151" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path d="M109.576,219.151c60.419,0,109.573-49.156,109.573-109.576C219.149,49.156,169.995,0,109.576,0S0.002,49.156,0.002,109.575 C0.002,169.995,49.157,219.151,109.576,219.151z M109.576,15c52.148,0,94.573,42.426,94.574,94.575 c0,52.149-42.425,94.575-94.574,94.576c-52.148-0.001-94.573-42.427-94.573-94.577C15.003,57.427,57.428,15,109.576,15z"></path> <path d="M94.861,156.507c2.929,2.928,7.678,2.927,10.606,0c2.93-2.93,2.93-7.678-0.001-10.608l-28.82-28.819l83.457-0.008 c4.142-0.001,7.499-3.358,7.499-7.502c-0.001-4.142-3.358-7.498-7.5-7.498l-83.46,0.008l28.827-28.825 c2.929-2.929,2.929-7.679,0-10.607c-1.465-1.464-3.384-2.197-5.304-2.197c-1.919,0-3.838,0.733-5.303,2.196l-41.629,41.628 c-1.407,1.406-2.197,3.313-2.197,5.303c0.001,1.99,0.791,3.896,2.198,5.305L94.861,156.507z"></path> </g> </g></svg> */}
    </div>
      <div className="flex flex-col h-screen">
        <Navbar/>
        <h1 className=" text-center py-3 font-bold text-5xl">Chat with Data</h1>
        <div className="flex-grow p-6 lg:w-2/3 mx-auto">
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
                </div>))}
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
        <form onSubmit={handleSubmit} className="flex-none p-6 ">
          <div className="flex rounded-lg border border-gray-700 bg-gray-800 lg:w-2/3 mx-auto">  
            <input type="text" className="flex-grow px-4 py-2 bg-transparent text-white focus:outline-none" placeholder="Type your message..." value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
            <button type="submit" disabled={inputValue<=0} className="bg-purple-500 rounded-lg px-4 py-2 text-white font-semibold focus:outline-none hover:bg-purple-600 transition-colors duration-300 disabled:bg-gray-600">Send</button>
        </div>
        </form>
        </div>
    </div>
  )
}