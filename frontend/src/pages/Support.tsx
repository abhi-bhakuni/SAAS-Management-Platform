import { useState, useEffect, useRef, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Box, Typography, TextField, IconButton, Avatar, CircularProgress, Divider,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import SearchIcon from '@mui/icons-material/Search';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { chatApi } from '../services/api';

const WS_URL = 'http://localhost:3000';
const SUPPORT_EMAIL = 'support@nexus.com';

function timeLabel(date: string | Date) {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function Support() {
  const { user, isAuthenticated, isLoading } = useAuth();

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const activeConvIdRef = useRef<string | null>(null);

  // Keep ref in sync so socket callbacks always see latest value
  useEffect(() => { activeConvIdRef.current = activeConvId; }, [activeConvId]);

  const scrollBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  const selectConversation = useCallback(async (convId: string, convList?: any[]) => {
    setActiveConvId(convId);
    setLoadingMsgs(true);
    try {
      const { messages: msgs } = await chatApi.getMessages(convId);
      setMessages(msgs);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } finally {
      setLoadingMsgs(false);
    }
    setConversations((prev) => {
      const list = convList ?? prev;
      return list.map((c) => c.id === convId ? { ...c, unreadBySupport: 0 } : c);
    });
  }, []);

  // Load conversations and connect socket — only when auth is confirmed for support
  useEffect(() => {
    if (isLoading || !isAuthenticated || user?.email !== SUPPORT_EMAIL) return;

    let isMounted = true;

    const load = async () => {
      setLoadingConvs(true);
      try {
        const { conversations: convs } = await chatApi.getAllConversations();
        if (!isMounted) return;
        setConversations(convs);
        if (convs.length > 0) selectConversation(convs[0].id, convs);
      } finally {
        if (isMounted) setLoadingConvs(false);
      }
    };
    load();

    const socket = io(`${WS_URL}/chat`, {
      query: { userId: user!.id, userEmail: SUPPORT_EMAIL },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('new_message', ({ message, conversation }: any) => {
      if (message.conversationId === activeConvIdRef.current) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === conversation.id);
        if (exists) return prev.map((c) => c.id === conversation.id ? conversation : c);
        return [conversation, ...prev];
      });
    });

    socket.on('conversations_updated', ({ conversations: convs }: any) => {
      setConversations(convs);
    });

    return () => {
      isMounted = false;
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isLoading, isAuthenticated, user?.email]);

  const handleSend = useCallback(() => {
    if (!input.trim() || !activeConvId) return;
    const content = input.trim();
    setInput('');
    socketRef.current?.emit('send_message', {
      conversationId: activeConvId,
      content,
      senderType: 'SUPPORT',
      senderName: 'Support',
    });
    scrollBottom();
  }, [input, activeConvId, scrollBottom]);

  // --- Guard renders (AFTER all hooks) ---
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F0F11' }}>
        <CircularProgress sx={{ color: 'text.disabled' }} />
      </Box>
    );
  }

  if (!isAuthenticated || user?.email !== SUPPORT_EMAIL) {
    return <Navigate to="/dashboard" replace />;
  }

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const filtered = conversations.filter(
    (c) =>
      c.userName.toLowerCase().includes(search.toLowerCase()) ||
      c.userEmail.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#0F0F11', overflow: 'hidden' }}>
      {/* Left sidebar */}
      <Box sx={{
        width: 340, flexShrink: 0,
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Sidebar header */}
        <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <SupportAgentIcon sx={{ color: '#10B981', fontSize: 24 }} />
            <Typography variant="h6" fontWeight="800">Support Inbox</Typography>
          </Box>
          <Box sx={{ position: 'relative' }}>
            <SearchIcon sx={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'text.disabled', fontSize: 18 }} />
            <TextField
              fullWidth size="small" placeholder="Search conversations…"
              value={search} onChange={(e) => setSearch(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px', paddingLeft: '32px',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.07)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
                  '&.Mui-focused fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                },
                '& .MuiInputBase-input': { fontSize: '0.84rem' },
              }}
            />
          </Box>
        </Box>

        {/* Conversation list */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          {loadingConvs ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
              <CircularProgress size={24} sx={{ color: 'text.disabled' }} />
            </Box>
          ) : filtered.length === 0 ? (
            <Typography variant="body2" color="text.disabled" sx={{ p: 3, textAlign: 'center' }}>
              No conversations yet.
            </Typography>
          ) : (
            filtered.map((conv) => {
              const isActive = conv.id === activeConvId;
              const initials = conv.userName?.charAt(0)?.toUpperCase() ?? '?';
              return (
                <Box
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  sx={{
                    p: 2, display: 'flex', gap: 1.5, cursor: 'pointer',
                    backgroundColor: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                    borderLeft: isActive ? '3px solid #FFFFFF' : '3px solid transparent',
                    transition: 'all 0.15s',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.04)' },
                  }}
                >
                  <Avatar sx={{ width: 42, height: 42, backgroundColor: '#27272A', fontSize: '1rem', fontWeight: 700 }}>
                    {initials}
                  </Avatar>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.3 }}>
                      <Typography variant="body2" fontWeight="700" noWrap>{conv.userName}</Typography>
                      <Typography variant="caption" color="text.disabled" sx={{ flexShrink: 0, ml: 1 }}>
                        {conv.lastMessageAt ? timeLabel(conv.lastMessageAt) : ''}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.disabled" noWrap sx={{ maxWidth: 180 }}>
                        {conv.userEmail}
                      </Typography>
                      {conv.unreadBySupport > 0 && (
                        <Box sx={{
                          minWidth: 18, height: 18, borderRadius: '50%',
                          backgroundColor: '#10B981', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#fff' }}>
                            {conv.unreadBySupport}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })
          )}
        </Box>
      </Box>

      {/* Right chat panel */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {activeConv ? (
          <>
            {/* Chat header */}
            <Box sx={{
              px: 3, py: 2, borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', gap: 2,
              backgroundColor: 'rgba(255,255,255,0.01)',
            }}>
              <Avatar sx={{ width: 40, height: 40, backgroundColor: '#27272A', fontWeight: 700 }}>
                {activeConv.userName?.charAt(0)?.toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="body1" fontWeight="700">{activeConv.userName}</Typography>
                <Typography variant="caption" color="text.disabled">{activeConv.userEmail}</Typography>
              </Box>
            </Box>

            {/* Messages */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {loadingMsgs ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
                  <CircularProgress size={28} sx={{ color: 'text.disabled' }} />
                </Box>
              ) : messages.length === 0 ? (
                <Box sx={{ textAlign: 'center', pt: 6 }}>
                  <Typography variant="body2" color="text.disabled">
                    No messages yet. Reply to start the conversation.
                  </Typography>
                </Box>
              ) : (
                messages.map((msg) => {
                  const isSupport = msg.senderType === 'SUPPORT';
                  return (
                    <Box key={msg.id} sx={{ display: 'flex', justifyContent: isSupport ? 'flex-end' : 'flex-start', gap: 1 }}>
                      {!isSupport && (
                        <Avatar sx={{ width: 28, height: 28, backgroundColor: '#27272A', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0, mt: 0.3 }}>
                          {msg.senderName?.charAt(0)?.toUpperCase()}
                        </Avatar>
                      )}
                      <Box sx={{
                        maxWidth: '60%', px: 2, py: 1.2,
                        borderRadius: isSupport ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        backgroundColor: isSupport ? '#FFFFFF' : 'rgba(255,255,255,0.07)',
                        color: isSupport ? '#000000' : '#EDEDED',
                      }}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                          {msg.content}
                        </Typography>
                        <Typography variant="caption" sx={{
                          display: 'block', mt: 0.3, textAlign: 'right',
                          color: isSupport ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.3)',
                          fontSize: '0.65rem',
                        }}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })
              )}
              <div ref={bottomRef} />
            </Box>

            <Divider sx={{ opacity: 0.05 }} />

            {/* Input */}
            <Box sx={{ p: 2, display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
              <TextField
                fullWidth multiline maxRows={4}
                placeholder="Type a reply…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '14px',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.07)' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.14)' },
                    '&.Mui-focused fieldset': { borderColor: 'rgba(255,255,255,0.24)' },
                  },
                }}
              />
              <IconButton
                onClick={handleSend}
                disabled={!input.trim()}
                sx={{
                  backgroundColor: '#FFFFFF', color: '#000000', width: 44, height: 44, flexShrink: 0,
                  '&:hover': { backgroundColor: '#E4E4E7' },
                  '&.Mui-disabled': { backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.25)' },
                }}
              >
                <SendIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>
          </>
        ) : (
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <SupportAgentIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
            <Typography variant="h6" color="text.disabled" fontWeight="600">Select a conversation</Typography>
            <Typography variant="body2" color="text.disabled">
              Choose a user from the left to start replying.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
