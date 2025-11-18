
const { useState, useEffect, createContext, useContext, useRef } = React;

// --- Authentication Hook ---

const AuthContext = createContext(undefined);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUserRaw = localStorage.getItem('lime-ai-user');
    if (storedUserRaw) {
      try {
        const parsed = JSON.parse(storedUserRaw);
        if (parsed && parsed.username) {
          setUser(parsed);
        } else {
          localStorage.removeItem('lime-ai-user');
        }
      } catch (e) {
        localStorage.removeItem('lime-ai-user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (username, pass) => {
    const storedCreds = localStorage.getItem(`lime_user_${username}`);
    if (storedCreds) {
      const creds = JSON.parse(storedCreds);
      if (creds.password === pass) {
        const loggedInUser = { username };
        setUser(loggedInUser);
        localStorage.setItem('lime-ai-user', JSON.stringify(loggedInUser));
        return true;
      }
    }
    return false;
  };

  const signup = (username, pass) => {
    if (localStorage.getItem(`lime_user_${username}`)) {
      return false; // User already exists
    }
    const newUserCreds = { password: pass };
    localStorage.setItem(`lime_user_${username}`, JSON.stringify(newUserCreds));
    const newUser = { username };
    setUser(newUser);
    localStorage.setItem('lime-ai-user', JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('lime-ai-user');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// --- Components ---

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, signup } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const success = login(username, password);
      if (!success) {
        setError('Invalid username or password.');
      }
    } else {
      const success = signup(username, password);
      if (!success) {
        setError('An account with this username already exists.');
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white selection:bg-[#ccff00] selection:text-black">
      <div className="w-full max-w-sm p-8 border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-black mb-2 tracking-tight">
            lime<span className="text-[#ccff00] text-7xl">.</span>ai
          </h1>
          <div className="h-2 w-24 bg-[#ccff00] mx-auto rounded-full"></div>
          <p className="text-black mt-4 font-semibold text-lg">
            {isLogin ? 'WELCOME BACK' : 'CREATE ACCOUNT'}
          </p>
        </div>
        
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="block w-full px-5 py-4 text-black bg-gray-50 border-2 border-black rounded-xl focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_#ccff00] transition-all placeholder-gray-400 font-bold text-lg"
              placeholder="Username"
            />
          </div>
          <div className="space-y-1">
             <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="block w-full px-5 py-4 text-black bg-gray-50 border-2 border-black rounded-xl focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_#ccff00] transition-all placeholder-gray-400 font-bold text-lg"
              placeholder="Password"
            />
          </div>
          
          {error && (
            <div className="p-3 bg-black text-[#ccff00] rounded-lg text-center border-2 border-black">
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}
          
          <button type="submit" className="w-full py-4 font-black text-xl text-black bg-[#ccff00] border-2 border-black rounded-xl hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all">
            {isLogin ? 'SIGN IN' : 'SIGN UP'}
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }} 
            className="text-base font-bold text-gray-400 hover:text-black underline decoration-2 decoration-[#ccff00] underline-offset-4 transition-colors"
          >
            {isLogin ? "Don't have an account? Join" : 'Already a member? Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

const QAPanel = () => {
  const [messages, setMessages] = useState([
    { role: 'model', content: "Hello! I'm lime.ai. Ask me anything." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const history = messages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
    }));

    try {
      // Access generateAnswer from the global service object
      const response = await window.geminiService.generateAnswer(input, history);
      const modelMessage = { role: 'model', content: response };
      setMessages((prev) => [...prev, modelMessage]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'model', content: "I encountered an issue. Please try again." }]);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full px-4 font-sans">
      <div className="flex-1 overflow-y-auto space-y-6 py-8 no-scrollbar">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-6 py-4 text-lg font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] ${
              msg.role === 'user' 
                ? 'bg-[#ccff00] text-black border-2 border-black rounded-3xl rounded-tr-none' 
                : 'bg-black text-white border-2 border-black rounded-3xl rounded-tl-none'
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="px-6 py-5 rounded-3xl rounded-tl-none bg-black border-2 border-black">
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-[#ccff00] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-[#ccff00] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-[#ccff00] rounded-full animate-bounce"></div>
                </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>
      
      <div className="pb-8 pt-4">
        <div className="relative group">
          <div className="relative flex items-center bg-white border-4 border-black rounded-full shadow-[6px_6px_0px_0px_#ccff00] transition-all focus-within:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus-within:translate-x-[2px] focus-within:translate-y-[2px]">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask lime.ai..."
              className="w-full pl-8 py-4 bg-transparent text-black placeholder-gray-400 focus:outline-none rounded-full font-bold text-xl"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="mr-3 p-3 rounded-full bg-black text-[#ccff00] hover:bg-[#ccff00] hover:text-black disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MainApp = () => {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col h-screen bg-white selection:bg-[#ccff00] selection:text-black">
      <header className="flex items-center justify-between px-8 py-6 bg-white border-b-4 border-black sticky top-0 z-10">
        <div className="flex items-center">
          <h1 className="text-3xl font-black tracking-tight text-black hover:text-[#ccff00] transition-colors cursor-default">
            lime.ai
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:block text-sm font-black uppercase tracking-widest text-black bg-[#ccff00] px-3 py-1 rounded-md border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            {user?.username}
          </div>
          <button
            onClick={logout}
            className="text-base font-bold text-black hover:text-[#ccff00] bg-black hover:bg-black px-4 py-2 rounded-lg transition-all border-2 border-black hover:shadow-[4px_4px_0px_0px_#ccff00] text-white"
          >
            Sign Out
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-hidden flex flex-col relative bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
        <QAPanel />
      </main>
    </div>
  );
};

const App = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-20 h-20 border-8 border-black border-t-[#ccff00] rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white text-black min-h-screen font-sans antialiased">
      {user ? <MainApp /> : <AuthPage />}
    </div>
  );
};

// --- Mounting Logic ---
console.log("Attempting to mount React app...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
