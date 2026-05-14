import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from '@tauri-apps/plugin-opener';
import { useAppStore } from "./store/useAppStore";
import "./App.css";

function App() {
  const { auth, presentation } = useAppStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup" | "forgot">("login");

  const leftPanelWidth = 220;
  const rightPanelWidth = 280;

  // Dummy slides for the grid to interact with
  const slides = [
    { id: "1", title: "Slide 1" },
    { id: "2", title: "Slide 2" },
    { id: "3", title: "Slide 3" },
    { id: "4", title: "Slide 4" }
  ];

  useEffect(() => {
    // Check session on mount
    async function checkSession() {
      try {
        const response: any = await invoke("check_session");
        if (response.success && response.user) {
          auth.login(response.user);
        }
      } catch (err) {
        console.error("Session check failed", err);
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  const isValidEmailOrPhone = (val: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[0-9\s\-]{7,15}$/;
    return emailRegex.test(val) || phoneRegex.test(val);
  };

  const [accountRestored, setAccountRestored] = useState(false);

  const handleLogin = async () => {
    setAuthError("");
    setAccountRestored(false);

    if (!email || !password) {
      setAuthError("Email and password are required.");
      return;
    }

    if (!isValidEmailOrPhone(email)) {
      setAuthError("Please enter a valid email or phone number.");
      return;
    }

    if (password.length < 8) {
      setAuthError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const response: any = await invoke("login_user", { email, password });
      if (response.success && response.user) {
        if (response.account_restored) {
          setAccountRestored(true);
        }
        auth.login(response.user);
      } else {
        if (response.error_code === "TOKEN_REVOKED") {
          setAuthError("Your session expired or your password was changed. Please log in again.");
        } else if (response.error_code === "ACCOUNT_LOCKED") {
          setAuthError(`Account locked. Try again after ${response.locked_until || 'a few minutes'}.`);
        } else if (response.error_code === "CLIENT_OUTDATED") {
          setAuthError("Client outdated. Please update your application.");
        } else if (response.error_code === "USER_INACTIVE") {
          setAuthError("Your account is scheduled for deletion. Log in with your password to cancel.");
        } else if (response.error_code === "TOKEN_THEFT_DETECTED") {
          setAuthError("Security Alert: Session terminated.");
        } else {
          setAuthError(response.message || "Login failed");
        }
      }
    } catch (err: any) {
      setAuthError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    // Signup delegation to web platform per new directive
    openUrl('https://syncsanctuary.app/auth/signup');
  };

  const handleForgotPassword = async () => {
    // Password reset delegation to web platform per new directive
    openUrl('https://syncsanctuary.app/password-reset');
  };

  if (loading && !auth.isAuthenticated && email === "") {
    return <div className="flex items-center justify-center h-screen bg-[#0D0D0D] text-white">Loading...</div>;
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0D0D0D]">
        <div className="w-[420px] bg-[#1E1E1E] border border-[#333333] rounded-xl p-10 shadow-[0_24px_64px_rgba(0,0,0,0.8)] flex flex-col items-center relative">
          {accountRestored && (
            <div className="absolute top-0 left-0 w-full bg-green-600 text-white text-xs font-semibold py-2 px-4 rounded-t-xl text-center">
              Welcome back! Your account deletion has been cancelled.
            </div>
          )}
          <div className="w-16 h-16 bg-[#1A56DB] rounded-full mb-4"></div>
          <h1 className="text-2xl font-bold text-[#EAEAEA] mb-1">SyncSanctuary</h1>
          <p className="text-[13px] text-[#888888] mb-8">Professional Church Media Production</p>

          <div className="w-full flex flex-col gap-4">
            {authMode === "signup" && (
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[#999999]">Username / Name</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your Name"
                  className="h-10 bg-[#161616] border border-[#333333] rounded-md text-sm text-[#EAEAEA] px-3 focus:border-[#1A56DB] focus:outline-none placeholder-[#444444]"
                />
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#999999]">Phone number or email</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="+82 10 1234 5678 or email@example.com"
                className="h-10 bg-[#161616] border border-[#333333] rounded-md text-sm text-[#EAEAEA] px-3 focus:border-[#1A56DB] focus:outline-none placeholder-[#444444]"
              />
            </div>

            {authMode !== "forgot" && (
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[#999999]">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-10 bg-[#161616] border border-[#333333] rounded-md text-sm text-[#EAEAEA] px-3 focus:border-[#1A56DB] focus:outline-none placeholder-[#444444]"
                  onKeyDown={(e) => { if (e.key === 'Enter') { authMode === "login" ? handleLogin() : handleSignup(); } }}
                />

                {authMode === "login" && (
                  <div className="flex justify-end mt-1">
                    <button onClick={() => setAuthMode("forgot")} className="text-[11px] text-[#4A90E2] hover:underline bg-transparent border-none cursor-pointer p-0">Forgot password?</button>
                  </div>
                )}
              </div>
            )}

            {authError && <span className="text-red-500 text-xs mt-1">{authError}</span>}

            {authMode === "login" && (
              <button
                className="w-full h-10 bg-[#1A56DB] text-white rounded-md text-sm font-semibold hover:bg-[#1E63F5] transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                onClick={handleLogin}
                disabled={loading || !email || password.length < 8}
              >
                {loading ? "Logging in..." : "Log In"}
              </button>
            )}

            {authMode === "signup" && (
              <button
                className="w-full h-10 bg-[#1A56DB] text-white rounded-md text-sm font-semibold hover:bg-[#1E63F5] transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                onClick={handleSignup}
                disabled={loading || !email || !username || password.length < 8}
              >
                {loading ? "Creating Account..." : "Sign Up"}
              </button>
            )}

            {authMode === "forgot" && (
              <button
                className="w-full h-10 bg-[#1A56DB] text-white rounded-md text-sm font-semibold hover:bg-[#1E63F5] transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                onClick={handleForgotPassword}
                disabled={loading || !email}
              >
                {loading ? "Sending..." : "Reset Password"}
              </button>
            )}

            {authMode === "login" && (
              <>
                <div className="flex items-center my-2">
                  <div className="flex-1 border-t border-[#2A2A2A]"></div>
                  <span className="px-2 text-[11px] text-[#555555]">or</span>
                  <div className="flex-1 border-t border-[#2A2A2A]"></div>
                </div>

                <button
                  className="w-full h-10 bg-[#2A2A2A] border border-[#444444] rounded-md text-sm text-[#EAEAEA] hover:bg-[#333333] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  onClick={() => openUrl('https://syncsanctuary.app/auth/google/desktop-callback')}
                >
                  <span>Continue with Google</span>
                </button>
              </>
            )}
          </div>

          <div className="mt-8 text-center text-[12px] text-[#888888]">
            {authMode === "login" ? (
              <>Don't have an account? <button onClick={() => setAuthMode("signup")} className="text-[#4A90E2] hover:underline bg-transparent border-none cursor-pointer p-0">Sign up</button></>
            ) : (
              <>Already have an account? <button onClick={() => setAuthMode("login")} className="text-[#4A90E2] hover:underline bg-transparent border-none cursor-pointer p-0">Log in</button></>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="root-layout" style={{
      gridTemplateColumns: `${leftPanelWidth}px 1fr ${rightPanelWidth}px`
    }}>
      {/* Title bar */}
      <div style={{ gridArea: 'titlebar', background: 'var(--bg-panel-header)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', borderBottom: '1px solid var(--border-subtle)' }} className="app-region-drag">
        SyncSanctuary
      </div>

      {/* Menu bar */}
      <div style={{ gridArea: 'menubar', background: 'var(--bg-toolbar)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: '12px', gap: '8px' }}>
        <div className="hover:bg-[#2A2A2A] px-2 py-0.5 rounded cursor-pointer">File</div>
        <div className="hover:bg-[#2A2A2A] px-2 py-0.5 rounded cursor-pointer">Edit</div>
        <div className="hover:bg-[#2A2A2A] px-2 py-0.5 rounded cursor-pointer">View</div>
        <div className="hover:bg-[#2A2A2A] px-2 py-0.5 rounded cursor-pointer">Profile</div>
        <div className="hover:bg-[#2A2A2A] px-2 py-0.5 rounded cursor-pointer">Scene Collection</div>
        <div className="hover:bg-[#2A2A2A] px-2 py-0.5 rounded cursor-pointer">Tools</div>
        <div className="hover:bg-[#2A2A2A] px-2 py-0.5 rounded cursor-pointer">Help</div>
      </div>

      {/* Toolbar */}
      <div style={{ gridArea: 'toolbar', background: 'var(--bg-toolbar)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', padding: '0 8px', justifyContent: 'space-between' }}>
        <div className="flex items-center gap-1">
          <button className="h-7 px-2.5 rounded bg-[#222222] border border-[#333333] text-xs text-[#CCCCCC] hover:bg-[#2E2E2E]">Slides</button>
          <button className="h-7 px-2.5 rounded bg-[#222222] border border-[#333333] text-xs text-[#CCCCCC] hover:bg-[#2E2E2E]">Arrangements</button>
          <button className="h-7 px-2.5 rounded bg-[#222222] border border-[#333333] text-xs text-[#CCCCCC] hover:bg-[#2E2E2E]">Reflow</button>
        </div>

        <div className="flex flex-col items-center justify-center p-1 border border-[#2A2A2A] rounded bg-[#0D0D0D]">
          <span className="text-[9px] text-[#555555] uppercase tracking-[1px] mb-0.5">Clear</span>
          <div className="flex gap-1">
            <button className="w-6 h-6 rounded-sm bg-white hover:brightness-120 cursor-pointer" title="Clear All Layers" onClick={() => presentation.setActiveSlide(null)}></button>
            <button className="w-6 h-6 rounded-sm bg-[#FF6B00] hover:brightness-120 cursor-pointer" title="Clear Slide" onClick={() => presentation.setActiveSlide(null)}></button>
            <button className="w-6 h-6 rounded-sm bg-[#00B4D8] hover:brightness-120 cursor-pointer" title="Clear Media"></button>
            <button className="w-6 h-6 rounded-sm bg-[#2ECC71] hover:brightness-120 cursor-pointer" title="Clear Audio"></button>
            <button className="w-6 h-6 rounded-sm bg-[#F1C40F] hover:brightness-120 cursor-pointer" title="Clear Announcements"></button>
            <button className="w-6 h-6 rounded-sm bg-[#E74C3C] hover:brightness-120 cursor-pointer" title="Clear Messages"></button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search..."
            className="w-[180px] h-6 bg-[#0F0F0F] border border-[#2A2A2A] rounded-[5px] text-xs px-2 focus:border-[#1A56DB] focus:outline-none text-white placeholder-[#444444]"
          />
        </div>
      </div>

      {/* Left Panel */}
      <div style={{ gridArea: 'left-panel', background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
        <div className="flex h-8 bg-[#111111] border-b border-[#1A1A1A]">
          <div className="flex-1 flex items-center justify-center text-[#EAEAEA] bg-[#1A1A1A] border-b-2 border-[#1A56DB] text-xs">Library</div>
          <div className="flex-1 flex items-center justify-center text-[#777777] text-xs cursor-pointer">Playlist</div>
        </div>
        <div className="p-2">
          <input
            type="text"
            placeholder="Search Library"
            className="w-full h-[22px] bg-[#0F0F0F] border border-[#222222] rounded text-xs px-2 text-white placeholder-[#444444]"
          />
        </div>
        <div className="flex-1 overflow-y-auto mt-1">
          <div className="flex items-center justify-between h-7 px-2 hover:bg-[#1E1E1E] cursor-pointer">
            <div className="flex items-center gap-1.5 text-[13px] text-[#CCCCCC]">
              <span className="text-[10px] text-[#555555]">▼</span>
              <span>Songs</span>
            </div>
            <div className="h-[18px] min-w-[20px] px-1 bg-[#222222] rounded-[9px] text-[10px] text-[#777777] flex items-center justify-center">42</div>
          </div>
          <div className="flex items-center justify-between h-7 px-2 hover:bg-[#1E1E1E] cursor-pointer">
            <div className="flex items-center gap-1.5 text-[13px] text-[#CCCCCC]">
              <span className="text-[10px] text-[#555555]">▼</span>
              <span>Announcements</span>
            </div>
            <div className="h-[18px] min-w-[20px] px-1 bg-[#222222] rounded-[9px] text-[10px] text-[#777777] flex items-center justify-center">12</div>
          </div>
        </div>
      </div>

      {/* Center Panel */}
      <div style={{ gridArea: 'center', background: 'var(--bg-panel)', display: 'flex', flexDirection: 'column' }}>
        <div className="flex h-[34px] bg-[#141414] border-b border-[#1A1A1A] overflow-x-auto">
          <div className="flex items-center justify-between min-w-[120px] max-w-[220px] px-3 bg-[#1A1A1A] border-t-2 border-[#1A56DB] text-[#EAEAEA] text-xs font-medium">
            <span className="truncate">Sunday Service</span>
            <span className="text-[#444444] cursor-pointer hover:text-white">✕</span>
          </div>
        </div>
        <div className="flex items-center h-[36px] bg-[#222222] border-b border-[#1A1A1A] px-2">
          {/* Slide editor toolbar stub */}
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-[#141414]">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
            {slides.map(slide => (
              <div
                key={slide.id}
                onClick={() => presentation.setActiveSlide(slide.id)}
                className={`aspect-video bg-[#080808] border-[1.5px] rounded flex flex-col cursor-pointer transition-colors ${
                  presentation.activeSlideId === slide.id
                    ? 'border-[#1A56DB] shadow-[0_0_0_1px_#1A56DB]'
                    : 'border-[#222222] hover:border-[#444444]'
                }`}
              >
                <div className="flex-1 flex items-center justify-center text-white text-xl font-bold">
                  {slide.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div style={{ gridArea: 'right-panel', background: 'var(--bg-panel)', borderLeft: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
        <div className="h-[40%] bg-[#111111] border-b border-[#1A1A1A] flex flex-col">
          <div className="flex items-center justify-between h-6 bg-[#1A1A1A] px-2">
            <span className="text-[10px] text-[#555555]">Audience</span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[#333333]">1920×1080</span>
              <div className={`w-2 h-2 rounded-full ${presentation.activeSlideId ? 'bg-[#E03A2F]' : 'bg-[#333333]'}`}></div>
            </div>
          </div>
          <div className="flex-1 m-1 border border-[#222222] bg-black flex items-center justify-center text-[11px] text-[#333333]">
            {presentation.activeSlideId ? (
              <span className="text-white text-2xl font-bold">
                {slides.find(s => s.id === presentation.activeSlideId)?.title}
              </span>
            ) : (
              "No Output"
            )}
          </div>
        </div>
        <div className="h-[30%] bg-[#111111] border-b border-[#1A1A1A]">
          {/* Media bin stub */}
        </div>
        <div className="flex-1 bg-[#1A1A1A]">
          {/* Inspector stub */}
        </div>
      </div>

      {/* Status Bar */}
      <div style={{ gridArea: 'statusbar', background: 'var(--bg-panel-header)', display: 'flex', alignItems: 'center', borderTop: '1px solid var(--border-subtle)' }}>
      </div>
    </div>
  );
}

export default App;
