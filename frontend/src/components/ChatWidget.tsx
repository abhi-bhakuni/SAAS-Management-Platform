import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Typography, TextField, IconButton, Avatar, Fade, CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { chatApi } from '../services/api';

const WS_URL = 'http://localhost:3000';

export function ChatWidget() {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [pulse, setPulse] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Stop pulse after 6 s so it doesn't loop forever
  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 6000);
    return () => clearTimeout(t);
  }, []);

  const scrollBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  // Connect socket when widget opens
  useEffect(() => {
    if (!open || !user) return;

    const load = async () => {
      setLoading(true);
      try {
        const { conversation, messages: msgs } = await chatApi.getMyConversation();
        setConversationId(conversation.id);
        setMessages(msgs);
        scrollBottom();
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();

    const socket = io(`${WS_URL}/chat`, {
      query: { userId: user.id, userEmail: user.email },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('new_message', ({ message }: any) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      scrollBottom();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [open, user]);

  const handleSend = async () => {
    if (!input.trim() || !conversationId || !user) return;
    setSending(true);
    const content = input.trim();
    setInput('');

    socketRef.current?.emit('send_message', {
      conversationId,
      content,
      senderType: 'USER',
      senderName: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email,
    });

    setSending(false);
    scrollBottom();
  };

  if (!isAuthenticated || user?.email === 'support@nexus.com') return null;

  return (
    <>
      {/* Chat panel */}
      <Fade in={open}>
        <Box sx={{
          position: 'fixed', bottom: 90, right: 24, zIndex: 1400,
          width: 360, height: 520,
          backgroundColor: '#18181B',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          pointerEvents: open ? 'auto' : 'none',
        }}>
          {/* Header */}
          <Box sx={{
            p: 2, display: 'flex', alignItems: 'center', gap: 1.5,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
          }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: '50%',
              backgroundColor: 'rgba(16,185,129,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <SupportAgentIcon sx={{ color: '#10B981', fontSize: 20 }} />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" fontWeight="700">Support</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#10B981' }} />
                <Typography variant="caption" color="text.disabled">Online</Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'text.disabled' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Messages */}
          <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
                <CircularProgress size={24} sx={{ color: 'text.disabled' }} />
              </Box>
            ) : messages.length === 0 ? (
              <Box sx={{ textAlign: 'center', pt: 4 }}>
                <SupportAgentIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.disabled">
                  Hi! How can we help you today?
                </Typography>
              </Box>
            ) : (
              messages.map((msg) => {
                const isUser = msg.senderType === 'USER';
                return (
                  <Box key={msg.id} sx={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', gap: 1 }}>
                    {!isUser && (
                      <Avatar sx={{ width: 26, height: 26, backgroundColor: 'rgba(16,185,129,0.2)', flexShrink: 0, mt: 0.3 }}>
                        <SupportAgentIcon sx={{ fontSize: 14, color: '#10B981' }} />
                      </Avatar>
                    )}
                    <Box sx={{
                      maxWidth: '72%',
                      px: 1.8, py: 1,
                      borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      backgroundColor: isUser ? '#FFFFFF' : 'rgba(255,255,255,0.06)',
                      color: isUser ? '#000000' : '#EDEDED',
                    }}>
                      <Typography variant="body2" sx={{ wordBreak: 'break-word', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                        {msg.content}
                      </Typography>
                      <Typography variant="caption" sx={{
                        display: 'block', mt: 0.3, textAlign: 'right',
                        color: isUser ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.3)',
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

          {/* Input */}
          <Box sx={{
            p: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', gap: 1, alignItems: 'flex-end',
          }}>
            <TextField
              fullWidth multiline maxRows={3} size="small"
              placeholder="Type a message…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                  '&.Mui-focused fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
                },
                '& .MuiInputBase-input': { fontSize: '0.88rem' },
              }}
            />
            <IconButton
              onClick={handleSend}
              disabled={!input.trim() || sending}
              sx={{
                backgroundColor: '#FFFFFF', color: '#000000', width: 38, height: 38, flexShrink: 0,
                '&:hover': { backgroundColor: '#E4E4E7' },
                '&.Mui-disabled': { backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' },
              }}
            >
              <SendIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>
      </Fade>

      {/* Floating button */}
      <Box
        onClick={() => setOpen((v) => !v)}
        sx={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1400,
          width: 56, height: 56, borderRadius: '50%',
          backgroundColor: open ? '#FFFFFF' : '#FFFFFF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': { transform: 'scale(1.08)', boxShadow: '0 12px 40px rgba(0,0,0,0.5)' },
          '@keyframes pulse-ring': {
            '0%': { transform: 'scale(1)', opacity: 0.6 },
            '100%': { transform: 'scale(1.7)', opacity: 0 },
          },
          ...(pulse && !open && {
            '&::before': {
              content: '""',
              position: 'absolute', inset: 0, borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              animation: 'pulse-ring 1.4s ease-out infinite',
            },
          }),
        }}
      >
        {open
          ? <CloseIcon sx={{ color: '#000000', fontSize: 22 }} />
          : <ChatBubbleOutlineIcon sx={{ color: '#000000', fontSize: 22 }} />
        }
      </Box>
    </>
  );
}
