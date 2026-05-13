import { useState } from "react";
import "./App.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Layout state
  const leftPanelWidth = 220;
  const rightPanelWidth = 280;

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0D0D0D]">
        <div className="w-[420px] bg-[#1E1E1E] border border-[#333333] rounded-xl p-10 shadow-[0_24px_64px_rgba(0,0,0,0.8)] flex flex-col items-center">
          <div className="w-16 h-16 bg-[#1A56DB] rounded-full mb-4"></div>
          <h1 className="text-2xl font-bold text-[#EAEAEA] mb-1">SyncSanctuary</h1>
          <p className="text-[13px] text-[#888888] mb-8">Professional Church Media Production</p>

          <div className="w-full flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#999999]">Phone number or email</label>
              <input
                type="text"
                placeholder="+82 10 1234 5678 or email@example.com"
                className="h-10 bg-[#161616] border border-[#333333] rounded-md text-sm text-[#EAEAEA] px-3 focus:border-[#1A56DB] focus:outline-none placeholder-[#444444]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#999999]">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="h-10 bg-[#161616] border border-[#333333] rounded-md text-sm text-[#EAEAEA] px-3 focus:border-[#1A56DB] focus:outline-none placeholder-[#444444]"
              />
              <div className="flex justify-end mt-1">
                <a href="#" className="text-[11px] text-[#4A90E2] hover:underline">Forgot password?</a>
              </div>
            </div>

            <button
              className="w-full h-10 bg-[#1A56DB] text-white rounded-md text-sm font-semibold hover:bg-[#1E63F5] transition-colors mt-2"
              onClick={() => setIsAuthenticated(true)}
            >
              Log In
            </button>

            <div className="flex items-center my-2">
              <div className="flex-1 border-t border-[#2A2A2A]"></div>
              <span className="px-2 text-[11px] text-[#555555]">or</span>
              <div className="flex-1 border-t border-[#2A2A2A]"></div>
            </div>

            <button className="w-full h-10 bg-[#2A2A2A] border border-[#444444] rounded-md text-sm text-[#EAEAEA] hover:bg-[#333333] transition-colors flex items-center justify-center gap-2">
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="mt-8 text-center text-[12px] text-[#888888]">
            Don't have an account? <a href="#" className="text-[#4A90E2] hover:underline">Sign up</a>
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
            <button className="w-6 h-6 rounded-sm bg-white hover:brightness-120 cursor-pointer" title="Clear All Layers"></button>
            <button className="w-6 h-6 rounded-sm bg-[#FF6B00] hover:brightness-120 cursor-pointer" title="Clear Slide"></button>
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
            {/* Slide thumbnails stub */}
            <div className="aspect-video bg-[#080808] border-[1.5px] border-[#222222] rounded flex flex-col">
              <div className="flex-1 flex items-center justify-center text-white text-xl font-bold">Slide 1</div>
            </div>
            <div className="aspect-video bg-[#080808] border-[1.5px] border-[#222222] rounded flex flex-col">
              <div className="flex-1 flex items-center justify-center text-white text-xl font-bold">Slide 2</div>
            </div>
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
              <div className="w-2 h-2 rounded-full bg-[#333333]"></div>
            </div>
          </div>
          <div className="flex-1 m-1 border border-[#222222] bg-black flex items-center justify-center text-[11px] text-[#333333]">
            No Output
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
