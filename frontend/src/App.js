import React, { useState, useEffect, useRef } from "react";
import { 
  FaBars, 
  FaChevronUp, 
  FaEllipsisV, 
  FaMicrophone, 
  FaPlus, 
  FaTrash, 
  FaTimes,
  FaPaperPlane, 
  FaRobot, 
  FaUser, 
  FaChevronDown,
  FaClipboard,
  FaMagic,
  FaCog,
  FaCopy
} from "react-icons/fa";

export default function NeuratekChat() {
  // Load history from localStorage or initialize with empty chat
  const [chatHistories, setChatHistories] = useState(() => {
    const saved = localStorage.getItem("chatHistories");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error("Error parsing chatHistories:", err);
      }
    }
    return [{ id: Date.now(), summary: "", messages: [] }];
  });

  // Current chat is the last in the list
  const [currentChatIndex, setCurrentChatIndex] = useState(() => chatHistories.length - 1);

  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [showPasteAsClaudeTooltip, setShowPasteAsClaudeTooltip] = useState(false);
  const [showCopiedTooltip, setShowCopiedTooltip] = useState(false);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState(null);
  const [visualMode, setVisualMode] = useState("standard"); // "standard", "dark", "creative"

  // Dynamic loading indicator
  const loadingSteps = ["Analizando solicitud...", "Procesando información...", "Generando respuesta...", "Refinando contenido..."];
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);

  // Voice recognition states
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  // Ref to track the last result received
  const lastResultTimeRef = useRef(null);
  // Ref for silence detection interval
  const silenceIntervalRef = useRef(null);

  // Reference for auto-scrolling to the end of chat
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Context menu for chat (sidebar)
  const [sidebarContextMenu, setSidebarContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    chatIndex: null,
  });

  // Message context menu
  const [messageContextMenu, setMessageContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    messageIndex: null,
  });

  // Settings modal
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Auto-scroll when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistories, currentChatIndex]);

  // Persist history in localStorage
  useEffect(() => {
    localStorage.setItem("chatHistories", JSON.stringify(chatHistories));
  }, [chatHistories]);

  // Update loading indicator while waiting for response
  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStepIndex((prev) => (prev + 1) % loadingSteps.length);
      }, 1000);
    } else {
      setLoadingStepIndex(0);
    }
    return () => interval && clearInterval(interval);
  }, [loading, loadingSteps.length]);

  // Close context menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (sidebarContextMenu.visible) {
        setSidebarContextMenu((prev) => ({ ...prev, visible: false }));
      }
      if (messageContextMenu.visible) {
        setMessageContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [sidebarContextMenu.visible, messageContextMenu.visible]);

  // Initialize voice recognition API (Web Speech API)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      // Use continuous mode to extend listening
      recog.continuous = true;
      recog.interimResults = false;
      recog.lang = "es-ES";

      recog.onresult = (event) => {
        // Update the last instant a result was received
        lastResultTimeRef.current = Date.now();
        // Accumulate results
        const result = event.results[event.results.length - 1][0].transcript;
        setInputText(result);
      };

      recog.onerror = (event) => {
        console.error("Voice recognition error:", event.error);
        setIsRecording(false);
        clearInterval(silenceIntervalRef.current);
      };

      recog.onend = () => {
        // When recognition stops (by max time or silence)
        setIsRecording(false);
        clearInterval(silenceIntervalRef.current);
        // If there's accumulated text, send the message automatically
        if (inputText && inputText !== "Recibiendo voz...") {
          // Small delay to ensure state update
          setTimeout(() => {
            sendMessage();
          }, 100);
        }
      };

      setRecognition(recog);
    } else {
      console.error("Your browser doesn't support the voice recognition API.");
    }
  }, [inputText]);

  // Add paste event listener to intercept clipboard data
  useEffect(() => {
    const handlePaste = (e) => {
      // Check if custom paste is active and input is focused
      if (document.activeElement === inputRef.current && showPasteAsClaudeTooltip) {
        e.preventDefault();
        const clipboardData = e.clipboardData || window.clipboardData;
        const pastedText = clipboardData.getData('text');
        
        if (pastedText) {
          // Process the pasted content
          processPastedContent(pastedText);
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [showPasteAsClaudeTooltip]);

  // Function to process pasted content as if it came from Claude
  const processPastedContent = (text) => {
    if (!text.trim()) return;
    
    setLoading(true);
    
    // Create a user message asking about the pasted content
    const userMessage = { 
      role: "user", 
      text: "He copiado este texto para analizarlo:" 
    };
    
    // Create a bot message with the pasted content
    const botMessage = {
      role: "bot",
      text: text,
      reasoning: "Contenido pegado como Claude",
      isPasted: true // Mark this as pasted content
    };

    // Add both messages to the chat
    const currentMessages = [
      ...chatHistories[currentChatIndex].messages,
      userMessage,
      botMessage
    ];

    // Update the chat summary if this is the first message
    const newSummary =
      chatHistories[currentChatIndex].messages.length === 0
        ? "Análisis de texto copiado"
        : chatHistories[currentChatIndex].summary;

    // Update chat history
    setChatHistories((prev) => {
      const updated = [...prev];
      updated[currentChatIndex] = {
        ...updated[currentChatIndex],
        messages: currentMessages,
        summary: newSummary,
      };
      return updated;
    });

    // Clear input and finish loading
    setInputText("");
    setLoading(false);
    setShowPasteAsClaudeTooltip(false);
  };

  // Function to start microphone
  const startMic = () => {
    if (recognition) {
      setInputText("Recibiendo voz...");
      setIsRecording(true);
      // Start recognition in continuous mode
      recognition.start();
      // Mark current instant
      lastResultTimeRef.current = Date.now();
      // Every 500ms check if silence threshold has passed (e.g., 2 sec)
      silenceIntervalRef.current = setInterval(() => {
        if (Date.now() - lastResultTimeRef.current > 6000) {
          recognition.stop();
          clearInterval(silenceIntervalRef.current);
        }
      }, 500);
      // Also set a max recording limit of 30 sec
      setTimeout(() => {
        if (isRecording) {
          recognition.stop();
          clearInterval(silenceIntervalRef.current);
          setIsRecording(false);
        }
      }, 30000);
    }
  };

  // Function to manually stop the microphone (optional)
  const stopMic = () => {
    if (recognition && isRecording) {
      recognition.stop();
      clearInterval(silenceIntervalRef.current);
      setIsRecording(false);
    }
  };

  // Create a new chat (if the current one already has messages)
  const startNewChat = () => {
    if (chatHistories[currentChatIndex].messages.length > 0) {
      setChatHistories((prev) => [
        ...prev,
        { id: Date.now(), summary: "", messages: [] },
      ]);
      setCurrentChatIndex(chatHistories.length);
    }
  };

  // Delete all history
  const clearHistory = () => {
    if (window.confirm("¿Seguro que deseas borrar todo el historial?")) {
      setChatHistories([{ id: Date.now(), summary: "", messages: [] }]);
      setCurrentChatIndex(0);
    }
  };

  // Toggle paste as Claude mode
  const togglePasteAsClaudeMode = () => {
    setShowPasteAsClaudeTooltip(!showPasteAsClaudeTooltip);
    if (!showPasteAsClaudeTooltip) {
      inputRef.current?.focus();
    }
  };

  // Copy message text to clipboard
  const copyMessageToClipboard = (text, index) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedMessageIndex(index);
        setShowCopiedTooltip(true);
        setTimeout(() => {
          setShowCopiedTooltip(false);
          setCopiedMessageIndex(null);
        }, 2000);
      })
      .catch(err => {
        console.error('Error copying text: ', err);
      });
    
    setMessageContextMenu((prev) => ({ ...prev, visible: false }));
  };

  // Toggle visual mode
  const toggleVisualMode = (mode) => {
    setVisualMode(mode);
    setSettingsOpen(false);
  };

  // Handle context menu for each chat in the sidebar
  const handleSidebarContextMenu = (e, chatIndex) => {
    e.preventDefault();
    e.stopPropagation();
    setSidebarContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      chatIndex,
    });
  };

  // Handle context menu for messages
  const handleMessageContextMenu = (e, messageIndex) => {
    e.preventDefault();
    e.stopPropagation();
    setMessageContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      messageIndex,
    });
  };

  // Function to rename a chat
  const renameChat = () => {
    const newName = prompt("Introduce el nuevo nombre del chat:");
    if (newName) {
      setChatHistories((prev) => {
        const updated = [...prev];
        updated[sidebarContextMenu.chatIndex].summary = newName;
        return updated;
      });
    }
    setSidebarContextMenu((prev) => ({ ...prev, visible: false }));
  };

  // Function to delete a specific chat
  const deleteChat = () => {
    if (window.confirm("¿Seguro que deseas borrar este chat?")) {
      setChatHistories((prev) => {
        const updated = [...prev];
        updated.splice(sidebarContextMenu.chatIndex, 1);

        let newIndex = currentChatIndex;
        if (sidebarContextMenu.chatIndex === currentChatIndex) {
          newIndex = 0;
        } else if (sidebarContextMenu.chatIndex < currentChatIndex) {
          newIndex = currentChatIndex - 1;
        }

        if (updated.length === 0) {
          return [{ id: Date.now(), summary: "", messages: [] }];
        } else {
          setCurrentChatIndex(Math.min(newIndex, updated.length - 1));
          return updated;
        }
      });
    }
    setSidebarContextMenu((prev) => ({ ...prev, visible: false }));
  };

  // Send message and get response
  const sendMessage = async () => {
    if (!inputText.trim() || loading) return;
    setLoading(true);
    const newUserMessage = { role: "user", text: inputText };

    const currentMessages = [
      ...chatHistories[currentChatIndex].messages,
      newUserMessage,
    ];

    const newSummary =
      currentMessages.length === 1
        ? newUserMessage.text.length > 20
          ? newUserMessage.text.slice(0, 20) + "..."
          : newUserMessage.text
        : chatHistories[currentChatIndex].summary;

    setChatHistories((prev) => {
      const updated = [...prev];
      updated[currentChatIndex] = {
        ...updated[currentChatIndex],
        messages: currentMessages,
        summary: newSummary,
      };
      return updated;
    });

    const userMessageForAPI = inputText;
    setInputText("");

    const startTime = Date.now();

    try {
      const response = await fetch("https://neuratek.cl/ask/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userMessageForAPI,
          max_tokens: 1000,
          history: currentMessages,
        }),
      });
      const data = await response.json();
      const endTime = Date.now();
      const timeTaken = Math.round((endTime - startTime) / 1000);
      const reasoning = `Razonando durante ${timeTaken} segundo${timeTaken !== 1 ? "s" : ""}`;

      let response_text = data.response || "No se recibió respuesta.";

      const marker = "Asistente (responde brevemente en una sola oración, sin repetir el prompt y finaliza con un cierre breve):";  
      if (response_text.includes(marker)) {  
          response_text = response_text.split(marker)[1].trim(); // Solo ajusta desde el marcador  
      } 

      const botMessage = {
        role: "bot",
        text: response_text,
        reasoning: reasoning,
      };

      setChatHistories((prev) => {
        const updated = [...prev];
        updated[currentChatIndex] = {
          ...updated[currentChatIndex],
          messages: [...updated[currentChatIndex].messages, botMessage],
        };
        return updated;
      });
    } catch (error) {
      console.error("API Error:", error);
      const endTime = Date.now();
      const timeTaken = Math.round((endTime - startTime) / 1000);
      const reasoning = `Razonando durante ${timeTaken} segundo${timeTaken !== 1 ? "s" : ""}`;
      const errorMsg = {
        role: "bot",
        text: "⚠️ Error al obtener respuesta.",
        reasoning: reasoning,
      };

      setChatHistories((prev) => {
        const updated = [...prev];
        updated[currentChatIndex] = {
          ...updated[currentChatIndex],
          messages: [...updated[currentChatIndex].messages, errorMsg],
        };
        return updated;
      });
    }
    setLoading(false);
  };

  // Get CSS classes based on visual mode
  const getVisualModeClasses = () => {
    switch(visualMode) {
      case 'dark':
        return {
          mainBg: 'bg-gray-900',
          sidebarBg: 'bg-gray-800',
          chatHeaderBg: 'bg-gray-800 border-gray-700',
          messageUserBg: 'from-blue-600 to-indigo-700',
          messageBotBg: 'bg-gray-700 border-gray-600 text-gray-100',
          inputBg: 'bg-gray-800 border-gray-700 text-white',
          text: 'text-gray-200',
          lightText: 'text-gray-400',
          sidebarItem: 'hover:bg-gray-700',
          activeItem: 'bg-gray-700 border-l-4 border-indigo-500',
          iconBg: 'bg-gray-700',
          gradientBg: 'from-indigo-600 to-purple-700',
          tooltip: 'bg-gray-700 text-white',
          inputPlaceholder: 'placeholder-gray-500'
        };
      case 'creative':
        return {
          mainBg: 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50',
          sidebarBg: 'bg-white bg-opacity-80 backdrop-filter backdrop-blur-lg',
          chatHeaderBg: 'bg-white bg-opacity-80 backdrop-filter backdrop-blur-lg border-purple-200',
          messageUserBg: 'from-indigo-500 via-purple-500 to-pink-500',
          messageBotBg: 'bg-white bg-opacity-80 backdrop-filter backdrop-blur-sm border-purple-200 text-gray-800',
          inputBg: 'bg-white bg-opacity-80 backdrop-filter backdrop-blur-lg border-purple-200',
          text: 'text-gray-800',
          lightText: 'text-purple-500',
          sidebarItem: 'hover:bg-purple-50',
          activeItem: 'bg-purple-50 border-l-4 border-purple-500',
          iconBg: 'bg-gradient-to-r from-indigo-300 to-purple-300',
          gradientBg: 'from-indigo-500 via-purple-500 to-pink-500',
          tooltip: 'bg-purple-500 text-white',
          inputPlaceholder: 'placeholder-purple-300'
        };
      default: // standard
        return {
          mainBg: 'bg-slate-50',
          sidebarBg: 'bg-white',
          chatHeaderBg: 'bg-white border-gray-200',
          messageUserBg: 'from-indigo-600 to-purple-600',
          messageBotBg: 'bg-white border border-gray-200 text-gray-800',
          inputBg: 'bg-white border-gray-300',
          text: 'text-gray-800',
          lightText: 'text-gray-500',
          sidebarItem: 'hover:bg-gray-100',
          activeItem: 'bg-indigo-50 border-l-4 border-indigo-600',
          iconBg: 'bg-gray-200',
          gradientBg: 'from-indigo-600 to-purple-600',
          tooltip: 'bg-indigo-600 text-white',
          inputPlaceholder: 'placeholder-gray-400'
        };
    }
  };

  const visualClasses = getVisualModeClasses();
  const currentMessages = chatHistories[currentChatIndex]?.messages || [];

  return (
    <div className={`flex h-screen ${visualClasses.mainBg} font-sans relative`}>
      {/* Sidebar toggle for mobile */}
      {!sidebarOpen && (
        <button 
          onClick={() => setSidebarOpen(true)} 
          className={`fixed top-4 left-4 z-50 p-2 bg-gradient-to-r ${visualClasses.gradientBg} text-white rounded-full shadow-lg hover:opacity-90 transition-colors duration-200`}
          aria-label="Open sidebar"
        >
          <FaBars className="w-5 h-5" />
        </button>
      )}

      {/* Sidebar */}
      <div
        className={`transition-all duration-300 ease-in-out fixed md:relative z-40 h-full 
                   ${sidebarOpen ? "w-72 translate-x-0" : "-translate-x-full w-0"} 
                   md:w-72 ${visualClasses.sidebarBg} shadow-lg`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-indigo-700">Neuratek Chat</h1>
            <button 
              onClick={() => setSidebarOpen(false)}
              className={`p-2 ${visualClasses.lightText} rounded-full ${visualClasses.sidebarItem} md:hidden`}
              aria-label="Close sidebar"
            >
              <FaTimes />
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* New Chat Button */}
            <div className="flex mb-6">
              <button
                className={`flex-1 py-3 px-4 bg-gradient-to-r ${visualClasses.gradientBg} text-white rounded-lg 
                          hover:opacity-90 transition-all duration-200 shadow-md 
                          flex items-center justify-center gap-2 font-medium`}
                onClick={startNewChat}
              >
                <FaPlus className="w-4 h-4" />
                <span>Nuevo Chat</span>
              </button>
              <button
                onClick={clearHistory}
                className={`ml-2 p-3 ${visualClasses.lightText} hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200`}
                title="Borrar historial"
              >
                <FaTrash className="w-4 h-4" />
              </button>
            </div>

            {/* Model Selector */}
            <div className="mb-6">
              <div 
                className={`flex items-center justify-between p-3 ${visualClasses.sidebarItem} rounded-lg cursor-pointer transition-colors duration-200`}
                onClick={() => setModelMenuOpen(!modelMenuOpen)}
              >
                <div className="flex items-center">
                  <div className={`w-8 h-8 bg-gradient-to-r ${visualClasses.gradientBg} rounded-full flex items-center justify-center text-white`}>
                    <FaRobot className="w-4 h-4" />
                  </div>
                  <span className={`ml-3 font-medium ${visualClasses.text}`}>Neuratek</span>
                </div>
                <FaChevronDown className={`w-4 h-4 ${visualClasses.lightText} transition-transform duration-200 ${modelMenuOpen ? 'rotate-180' : ''}`} />
              </div>
              
              {modelMenuOpen && (
                <div className={`mt-2 ${visualClasses.sidebarBg} border border-gray-200 shadow-lg rounded-lg p-2 w-full`}>
                  <div className="p-2 font-medium text-indigo-600 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Caroline V1 (Actual)
                  </div>
                  <div className={`p-2 ${visualClasses.lightText} flex items-center`}>
                    <span className="w-2 h-2 bg-gray-300 rounded-full mr-2"></span>
                    Caroline V2 (No disponible)
                  </div>
                  <div className={`p-2 ${visualClasses.lightText} flex items-center`}>
                    <span className="w-2 h-2 bg-gray-300 rounded-full mr-2"></span>
                    Caroline V3 (No disponible)
                  </div>
                  <div className={`p-2 ${visualClasses.lightText} flex items-center`}>
                    <span className="w-2 h-2 bg-gray-300 rounded-full mr-2"></span>
                    Caroline V4 (No disponible)
                  </div>
                </div>
              )}
            </div>

            {/* Special Features Section */}
            <div className="mb-6">
              <h3 className={`text-xs font-semibold ${visualClasses.lightText} uppercase tracking-wider px-1 mb-2`}>Funciones Especiales</h3>
              
              <button
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200
                          ${visualClasses.sidebarItem} ${showPasteAsClaudeTooltip ? `bg-gradient-to-r ${visualClasses.gradientBg} text-white` : visualClasses.text}`}
                onClick={togglePasteAsClaudeMode}
              >
                <div className="flex items-center">
                  <div className={`w-8 h-8 ${showPasteAsClaudeTooltip ? 'bg-white bg-opacity-30' : `${visualClasses.iconBg}`} rounded-full flex items-center justify-center ${showPasteAsClaudeTooltip ? 'text-white' : visualClasses.text}`}>
                    <FaClipboard className="w-4 h-4" />
                  </div>
                  <span className="ml-3 font-medium">Neura Past</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${showPasteAsClaudeTooltip ? 'bg-white bg-opacity-30 text-white' : 'bg-indigo-100 text-indigo-800'}`}>
                  {showPasteAsClaudeTooltip ? 'Activo' : 'Inactivo'}
                </span>
              </button>
              
              <button
                className={`w-full flex items-center p-3 rounded-lg transition-all duration-200
                          ${visualClasses.sidebarItem} mt-2 ${visualClasses.text}`}
                onClick={() => setSettingsOpen(true)}
              >
                <div className={`w-8 h-8 ${visualClasses.iconBg} rounded-full flex items-center justify-center ${visualClasses.text}`}>
                  <FaCog className="w-4 h-4" />
                </div>
                <span className="ml-3 font-medium">Configuración Visual</span>
              </button>
            </div>

            {/* Chat History */}
            <div className="space-y-1">
              <h3 className={`text-xs font-semibold ${visualClasses.lightText} uppercase tracking-wider px-1 mb-2`}>Historial de Conversaciones</h3>
              
              {chatHistories.map((chat, index) => (
                <div
                  key={chat.id}
                  className={`group flex items-center justify-between p-3 rounded-lg transition-all duration-200
                            ${visualClasses.sidebarItem} cursor-pointer
                            ${index === currentChatIndex 
                              ? visualClasses.activeItem 
                              : "border-l-4 border-transparent"}`}
                  onClick={() => setCurrentChatIndex(index)}
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <div className={`flex-shrink-0 w-8 h-8 ${visualClasses.iconBg} rounded-full flex items-center justify-center ${visualClasses.text}`}>
                      {index + 1}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <p className={`text-sm font-medium ${visualClasses.text} truncate`}>
                        {chat.summary || `Chat ${index + 1}`}
                      </p>
                      <p className={`text-xs ${visualClasses.lightText} truncate`}>
                        {chat.messages.length} mensaje{chat.messages.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    className={`p-2 ${visualClasses.lightText} opacity-0 group-hover:opacity-100 hover:text-gray-600 transition-opacity duration-200`}
                    onClick={(e) => handleSidebarContextMenu(e, index)}
                    aria-label="Menu de opciones"
                  >
                    <FaEllipsisV className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {chatHistories.length === 0 && (
                <div className={`text-center py-6 ${visualClasses.lightText}`}>
                  No hay chats en el historial
                </div>
              )}
            </div>
          </div>
          
          {/* Sidebar Footer */}
          <div className={`border-t border-gray-200 p-4 text-xs ${visualClasses.lightText}`}>
            Neuratek v1.0 • © 2025
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full w-full">
        {/* Chat Header */}
        <div className={`${visualClasses.chatHeaderBg} border-b px-6 py-4 shadow-sm`}>
          <div className="flex justify-between items-center">
            <h2 className={`text-xl font-semibold ${visualClasses.text}`}>
              {chatHistories[currentChatIndex]?.summary || "Nueva Conversación"}
            </h2>
            <div className="flex items-center space-x-2">
              {showPasteAsClaudeTooltip && (
                <div className={`${visualClasses.tooltip} text-xs py-1 px-3 rounded-full animate-pulse`}>
                  Modo "Neurapasted" activado
                </div>
              )}
              {/* Visual mode indicator */}
              <button 
                onClick={() => setSettingsOpen(true)}
                className={`p-2 ${visualClasses.lightText} hover:text-indigo-600 rounded-full transition-colors duration-200`}
              >
                <FaCog className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {currentMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className={`w-24 h-24 bg-gradient-to-r ${visualClasses.gradientBg} rounded-full flex items-center justify-center text-white mb-6 shadow-lg`}>
                <FaRobot className="w-12 h-12" />
              </div>
              <h1 className={`text-3xl font-bold ${visualClasses.text} mb-4`}>¿Con qué puedo ayudarte?</h1>
              <p className={`${visualClasses.lightText} max-w-md`}>
                Soy tu asistente de IA avanzado. Pregúntame cualquier cosa y te ayudaré a encontrar respuestas.
              </p>
              <div className="mt-8 flex flex-col items-center">
                <button
                  onClick={togglePasteAsClaudeMode}
                  className={`flex items-center space-x-2 p-3 rounded-lg mb-3
                    ${showPasteAsClaudeTooltip ? `bg-gradient-to-r ${visualClasses.gradientBg} text-white` : `bg-white border border-gray-200 ${visualClasses.text}`} 
                    hover:shadow-md transition-all duration-200`}
                >
                  <FaClipboard className="w-5 h-5" />
                  <span>Activar "Neurapasted"</span>
                </button>
                <p className={`text-xs ${visualClasses.lightText} max-w-xs text-center`}>
                  Copia texto en cualquier lugar y pégalo directamente como si fuera una respuesta de Claude
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {currentMessages.map((msg, index) => {
                const showReasoning = msg.role === "bot" && msg.reasoning;
                const isBot = msg.role === "bot";
                const isPasted = msg.isPasted;
                
                return (
                  <div
                    key={index}
                    className={`flex ${isBot ? "justify-start" : "justify-end"} group`}
                    onContextMenu={(e) => handleMessageContextMenu(e, index)}
                  >
                    <div className={`flex ${isBot ? "flex-row" : "flex-row-reverse"} max-w-2xl`}>
                      <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center 
                                      ${isBot 
                                        ? `bg-gradient-to-r ${visualClasses.gradientBg} text-white` 
                                        : `${visualClasses.iconBg} ${visualClasses.text}`} 
                                      ${isBot ? "mr-2" : "ml-2"}`}>
                        {isBot ? <FaRobot className="w-4 h-4" /> : <FaUser className="w-4 h-4" />}
                      </div>
                      
                      <div className="flex flex-col relative">
                        {showReasoning && (
                          <div className={`text-xs ${visualClasses.lightText} mb-1 ml-1 flex items-center`}>
                            {isPasted ? (
                              <>
                                <FaClipboard className="w-3 h-3 mr-1" />
                                Contenido pegado como Neurapasted 
                              </>
                            ) : (
                              msg.reasoning
                            )}
                          </div>
                        )}
                        
                        <div className={`p-3 rounded-2xl shadow-sm 
                                        ${isBot 
                                          ? `${visualClasses.messageBotBg} ${isPasted ? 'border-l-4 border-purple-500' : ''}` 
                                          : `bg-gradient-to-r ${visualClasses.messageUserBg} text-white`}`}>
                          {msg.text}
                        </div>
                        
                        {/* Copy indicator */}
                        {showCopiedTooltip && copiedMessageIndex === index && (
                          <div className="absolute -top-8 left-0 bg-green-500 text-white text-xs py-1 px-2 rounded">
                            Copiado al portapapeles
                          </div>
                        )}
                        
                        {/* Quick actions on hover */}
                        <div className={`absolute ${isBot ? '-right-12' : '-left-12'} top-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col gap-2`}>
                          <button 
                            onClick={() => copyMessageToClipboard(msg.text, index)}
                            className={`p-2 ${visualClasses.sidebarBg} rounded-full shadow-sm hover:shadow-md transition-all duration-200`}
                            title="Copiar mensaje"
                          >
                            <FaCopy className={`w-4 h-4 ${visualClasses.lightText}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex justify-start">
                  <div className="flex flex-row max-w-md">
                    <div className={`flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-r ${visualClasses.gradientBg} text-white flex items-center justify-center mr-2`}>
                      <FaRobot className="w-4 h-4" />
                    </div>
                    
                    <div className={`${visualClasses.messageBotBg} p-4 rounded-2xl shadow-sm flex items-center space-x-2`}>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: "600ms" }}></div>
                      </div>
                      <span className={`text-sm ${visualClasses.lightText}`}>{loadingSteps[loadingStepIndex]}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef}></div>
            </div>
          )}
        </div>
        
        {/* Input Area */}
        <div className={`${visualClasses.chatHeaderBg} border-t p-4`}>
          <div className="max-w-4xl mx-auto flex flex-col">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                className={`w-full p-4 pr-32 rounded-2xl border ${visualClasses.inputBg} shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${visualClasses.inputPlaceholder}`}
                placeholder={showPasteAsClaudeTooltip ? "Pega contenido para procesarlo como Claude..." : "Escribe tu mensaje..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                disabled={loading || isRecording}
              />
              
              {/* Paste as Claude indicator */}
              {showPasteAsClaudeTooltip && (
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center">
                  <span className={`flex items-center ${visualClasses.tooltip} text-xs py-1 px-2 rounded-full`}>
                    <FaClipboard className="w-3 h-3 mr-1" />
                    Pegar como Neurapasted
                  </span>
                </div>
              )}
              
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                {/* Paste as Claude toggle */}
                <button
                  onClick={togglePasteAsClaudeMode}
                  className={`p-2.5 rounded-full ${
                    loading 
                      ? `${visualClasses.iconBg} ${visualClasses.lightText} cursor-not-allowed` 
                      : showPasteAsClaudeTooltip
                        ? `bg-gradient-to-r ${visualClasses.gradientBg} text-white` 
                        : `${visualClasses.iconBg} ${visualClasses.text} hover:bg-gray-300`
                  } transition-colors duration-200`}
                  disabled={loading}
                  title="Pegar como Neurapasted"
                >
                  <FaClipboard className="w-5 h-5" />
                </button>
              
                {/* Voice button */}
                <button
                  onClick={isRecording ? stopMic : startMic}
                  className={`p-2.5 rounded-full ${
                    loading 
                      ? `${visualClasses.iconBg} ${visualClasses.lightText} cursor-not-allowed` 
                      : isRecording 
                        ? "bg-red-500 text-white animate-pulse" 
                        : `${visualClasses.iconBg} ${visualClasses.text} hover:bg-gray-300`
                  } transition-colors duration-200`}
                  disabled={loading}
                  title={isRecording ? "Detener grabación" : "Iniciar grabación"}
                >
                  <FaMicrophone className="w-5 h-5" />
                </button>
                
                {/* Send button */}
                <button
                  onClick={sendMessage}
                  className={`p-2.5 rounded-full ${
                    loading || !inputText.trim() 
                      ? `${visualClasses.iconBg} ${visualClasses.lightText} cursor-not-allowed` 
                      : `bg-gradient-to-r ${visualClasses.gradientBg} text-white hover:opacity-90`
                  } transition-all duration-200 shadow-sm`}
                  disabled={loading || !inputText.trim()}
                >
                  {loading ? <FaChevronUp className="w-5 h-5" /> : <FaPaperPlane className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <div className={`mt-2 text-xs text-center ${visualClasses.lightText}`}>
              Neuratek puede cometer errores. Verifica siempre la información importante.
            </div>
          </div>
        </div>
      </div>

      {/* Context Menu for sidebar items */}
      {sidebarContextMenu.visible && (
        <div
          className={`fixed ${visualClasses.sidebarBg} border border-gray-200 shadow-lg rounded-lg p-2 z-50 w-36`}
          style={{ top: sidebarContextMenu.y, left: sidebarContextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={renameChat}
            className={`w-full text-left px-3 py-2 text-sm ${visualClasses.text} hover:bg-indigo-50 hover:text-indigo-700 rounded transition-colors duration-150 flex items-center`}
          >
            <span className="w-5 h-5 mr-2">✏️</span>
            Renombrar
          </button>
          <button
            onClick={deleteChat}
            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors duration-150 flex items-center"
          >
            <FaTrash className="w-4 h-4 mr-2" />
            Eliminar
          </button>
        </div>
      )}

      {/* Context Menu for messages */}
      {messageContextMenu.visible && (
        <div
          className={`fixed ${visualClasses.sidebarBg} border border-gray-200 shadow-lg rounded-lg p-2 z-50 w-48`}
          style={{ top: messageContextMenu.y, left: messageContextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              const msg = currentMessages[messageContextMenu.messageIndex];
              copyMessageToClipboard(msg.text, messageContextMenu.messageIndex);
            }}
            className={`w-full text-left px-3 py-2 text-sm ${visualClasses.text} hover:bg-indigo-50 hover:text-indigo-700 rounded transition-colors duration-150 flex items-center`}
          >
            <FaCopy className="w-4 h-4 mr-2" />
            Copiar texto
          </button>
          {currentMessages[messageContextMenu.messageIndex]?.role === "bot" && (
            <button
              onClick={() => {
                const text = currentMessages[messageContextMenu.messageIndex]?.text || "";
                setInputText((prev) => (prev ? `${prev}\n\n${text}` : text));
                setMessageContextMenu((prev) => ({ ...prev, visible: false }));
              }}
              className={`w-full text-left px-3 py-2 text-sm ${visualClasses.text} hover:bg-indigo-50 hover:text-indigo-700 rounded transition-colors duration-150 flex items-center`}
            >
              <FaMagic className="w-4 h-4 mr-2" />
              Usar como prompt
            </button>
          )}
        </div>
      )}

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${visualClasses.sidebarBg} rounded-xl shadow-2xl p-6 max-w-md w-full`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-xl font-bold ${visualClasses.text}`}>Configuración Visual</h2>
              <button
                onClick={() => setSettingsOpen(false)}
                className={`p-2 ${visualClasses.lightText} hover:text-gray-800 rounded-full`}
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className={`${visualClasses.lightText} text-sm mb-4`}>Selecciona el modo visual que prefieras para tu experiencia de chat</p>
              
              <button
                onClick={() => toggleVisualMode('standard')}
                className={`w-full p-4 rounded-lg border ${visualMode === 'standard' ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200'} flex items-center`}
              >
                <div className="w-12 h-12 bg-slate-50 rounded-lg mr-4 flex items-center justify-center">
                  <div className="w-8 h-8 bg-white rounded-full"></div>
                </div>
                <div className="text-left">
                  <h3 className={`font-medium ${visualClasses.text}`}>Estándar</h3>
                  <p className={`text-xs ${visualClasses.lightText}`}>Interfaz clara y profesional</p>
                </div>
              </button>
              
              <button
                onClick={() => toggleVisualMode('dark')}
                className={`w-full p-4 rounded-lg border ${visualMode === 'dark' ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200'} flex items-center`}
              >
                <div className="w-12 h-12 bg-gray-900 rounded-lg mr-4 flex items-center justify-center">
                  <div className="w-8 h-8 bg-gray-800 rounded-full"></div>
                </div>
                <div className="text-left">
                  <h3 className={`font-medium ${visualClasses.text}`}>Modo Oscuro</h3>
                  <p className={`text-xs ${visualClasses.lightText}`}>Menos fatiga visual en ambientes oscuros</p>
                </div>
              </button>
              
              <button
                onClick={() => toggleVisualMode('creative')}
                className={`w-full p-4 rounded-lg border ${visualMode === 'creative' ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200'} flex items-center`}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-lg mr-4 flex items-center justify-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-300 to-purple-300 rounded-full"></div>
                </div>
                <div className="text-left">
                  <h3 className={`font-medium ${visualClasses.text}`}>Creativo</h3>
                  <p className={`text-xs ${visualClasses.lightText}`}>Estilo vibrante con efectos de cristal</p>
                </div>
              </button>
            </div>
            
            <button
              onClick={() => setSettingsOpen(false)}
              className={`mt-6 w-full py-3 bg-gradient-to-r ${visualClasses.gradientBg} text-white rounded-lg hover:opacity-90 transition-all duration-200 shadow-md font-medium`}
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      )}
    </div>
  );
}