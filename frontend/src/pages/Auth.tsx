import { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Divider, 
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import GoogleIcon from '@mui/icons-material/Google';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useAuth } from '../context/AuthContext';

export function Auth() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        await register({ email, password, firstName: firstName || 'User', lastName: lastName || undefined });
      }
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '10px',
      fontSize: '0.875rem',
      backgroundColor: 'rgba(255,255,255,0.03)',
      transition: 'all 0.2s ease',
      '& fieldset': {
        borderColor: '#2A2A2E',
        transition: 'border-color 0.2s ease',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(255,255,255,0.15)',
      },
      '&.Mui-focused fieldset': {
        borderColor: 'rgba(255,255,255,0.4)',
        borderWidth: '1px',
      },
      '& input': {
        color: '#EDEDED',
        '&::placeholder': {
          color: '#52525B',
          opacity: 1,
        },
      },
      '& input:-webkit-autofill': {
        WebkitBoxShadow: '0 0 0 100px #1C1C21 inset',
        WebkitTextFillColor: '#EDEDED',
      },
    },
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: '#0F0F11',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient background glows */}
      <Box sx={{
        position: 'absolute',
        top: '-15%',
        left: '-10%',
        width: '55%',
        height: '55%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(96,165,250,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
        filter: 'blur(40px)',
      }} />
      <Box sx={{
        position: 'absolute',
        bottom: '-15%',
        right: '-10%',
        width: '55%',
        height: '55%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(192,132,252,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
        filter: 'blur(40px)',
      }} />
      {/* Subtle grid pattern */}
      <Box sx={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
        pointerEvents: 'none',
      }} />

      {/* Left branding panel — visible on md+ */}
      <Box sx={{
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '42%',
        p: 6,
        borderRight: '1px solid #1A1A1E',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 36, height: 36,
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #A1A1AA 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(255,255,255,0.08)',
          }}>
            <LayersOutlinedIcon sx={{ fontSize: 18, color: '#0F0F11' }} />
          </Box>
          <Typography fontWeight="700" fontSize="1rem" color="#EDEDED" letterSpacing="-0.02em">
            AcmeCorp
          </Typography>
        </Box>

        {/* Center copy */}
        <Box>
          <Typography variant="h3" fontWeight="800" color="#EDEDED" letterSpacing="-0.03em" lineHeight={1.15} mb={2}>
            Manage work.<br />
            <Box component="span" sx={{ color: '#A1A1AA' }}>Ship faster.</Box>
          </Typography>
          <Typography variant="body1" color="#52525B" lineHeight={1.7} mb={5}>
            One unified workspace for all your projects, tasks, and team collaboration.
          </Typography>
          {/* Feature pills */}
          {['Project tracking & milestones', 'Real-time team collaboration', 'Activity feeds & reporting'].map((feat) => (
            <Box key={feat} sx={{
              display: 'flex', alignItems: 'center', gap: 1.5, mb: 2,
            }}>
              <Box sx={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'linear-gradient(135deg, #60A5FA, #C084FC)',
                flexShrink: 0,
              }} />
              <Typography variant="body2" color="#71717A" fontWeight="500">
                {feat}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Bottom testimonial */}
        <Box sx={{
          p: 2.5,
          borderRadius: '14px',
          backgroundColor: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <Typography variant="body2" color="#A1A1AA" lineHeight={1.7} mb={1.5} fontStyle="italic">
            "AcmeCorp completely transformed how our team manages sprints. We ship 3× faster now."
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'linear-gradient(135deg, #60A5FA, #C084FC)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Typography fontSize="0.7rem" fontWeight="700" color="#0F0F11">S</Typography>
            </Box>
            <Box>
              <Typography variant="caption" fontWeight="700" color="#EDEDED" display="block">Sarah Chen</Typography>
              <Typography variant="caption" color="#52525B">Head of Engineering, Nova Labs</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Right auth panel */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 3, sm: 5 },
        position: 'relative',
        zIndex: 1,
      }}>
        <Box sx={{ width: '100%', maxWidth: 420 }}>
          {/* Mobile logo */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.5, mb: 5 }}>
            <Box sx={{
              width: 34, height: 34,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #FFFFFF 0%, #A1A1AA 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <LayersOutlinedIcon sx={{ fontSize: 16, color: '#0F0F11' }} />
            </Box>
            <Typography fontWeight="700" fontSize="1rem" color="#EDEDED">AcmeCorp</Typography>
          </Box>

          {/* Heading */}
          <Box mb={4}>
            <Typography variant="h4" fontWeight="800" color="#EDEDED" letterSpacing="-0.03em" mb={0.75}>
              {isLogin ? 'Welcome back' : 'Create account'}
            </Typography>
            <Typography variant="body2" color="#71717A">
              {isLogin
                ? 'Sign in to continue to your workspace.'
                : 'Get started — free forever for small teams.'}
            </Typography>
          </Box>

          {/* Error */}
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: '10px',
                backgroundColor: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#FCA5A5',
                '& .MuiAlert-icon': { color: '#F87171' },
              }}
            >
              {error}
            </Alert>
          )}

          {/* Form card */}
          <Box
            sx={{
              p: { xs: 3, sm: 3.5 },
              borderRadius: '16px',
              backgroundColor: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.06)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 32px 64px -16px rgba(0,0,0,0.5)',
            }}
          >
            {/* Google SSO */}
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon sx={{ fontSize: '18px !important', color: '#DB4437' }} />}
              sx={{
                py: 1.25,
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                color: '#EDEDED',
                borderColor: 'rgba(255,255,255,0.1)',
                backgroundColor: 'rgba(255,255,255,0.03)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  borderColor: 'rgba(255,255,255,0.18)',
                  boxShadow: 'none',
                },
              }}
            >
              Continue with Google
            </Button>

            {/* Divider */}
            <Box sx={{ display: 'flex', alignItems: 'center', my: 2.5 }}>
              <Divider sx={{ flexGrow: 1, borderColor: 'rgba(255,255,255,0.06)' }} />
              <Typography variant="caption" color="#3F3F46" sx={{ mx: 2, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                or
              </Typography>
              <Divider sx={{ flexGrow: 1, borderColor: 'rgba(255,255,255,0.06)' }} />
            </Box>

            {/* Fields */}
            <Box component="form" onSubmit={handleAuth}>
              {!isLogin && (
                <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" fontWeight="600" color="#71717A" sx={{ display: 'block', mb: 0.75, letterSpacing: '0.03em' }}>
                      FIRST NAME
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="Jane"
                      size="small"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      sx={fieldSx}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" fontWeight="600" color="#71717A" sx={{ display: 'block', mb: 0.75, letterSpacing: '0.03em' }}>
                      LAST NAME <Typography component="span" sx={{ fontSize: '0.65rem', opacity: 0.6 }}>(OPTIONAL)</Typography>
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="Smith"
                      size="small"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      sx={fieldSx}
                    />
                  </Box>
                </Box>
              )}

              <Box mb={2.5}>
                <Typography variant="caption" fontWeight="600" color="#71717A" sx={{ display: 'block', mb: 0.75, letterSpacing: '0.03em' }}>
                  EMAIL
                </Typography>
                <TextField
                  required
                  fullWidth
                  type="email"
                  placeholder="you@company.com"
                  size="small"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={fieldSx}
                />
              </Box>

              <Box mb={isLogin ? 1.5 : 2.5}>
                <Typography variant="caption" fontWeight="600" color="#71717A" sx={{ display: 'block', mb: 0.75, letterSpacing: '0.03em' }}>
                  PASSWORD
                </Typography>
                <TextField
                  required
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  size="small"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                          sx={{ color: '#52525B', '&:hover': { color: '#A1A1AA' } }}
                        >
                          {showPassword
                            ? <VisibilityOffOutlinedIcon fontSize="small" />
                            : <VisibilityOutlinedIcon fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={fieldSx}
                />
              </Box>

              {isLogin && (
                <Box sx={{ textAlign: 'right', mb: 2.5 }}>
                  <Typography
                    variant="caption"
                    fontWeight="600"
                    sx={{
                      color: '#A1A1AA',
                      cursor: 'pointer',
                      transition: 'color 0.15s',
                      '&:hover': { color: '#EDEDED' },
                    }}
                  >
                    Forgot password?
                  </Typography>
                </Box>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isSubmitting}
                endIcon={!isSubmitting && <ArrowForwardIcon sx={{ fontSize: '16px !important' }} />}
                sx={{
                  py: 1.35,
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  letterSpacing: '-0.01em',
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #D4D4D8 100%)',
                  color: '#0F0F11',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 8px 24px rgba(0,0,0,0.3)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #F4F4F5 0%, #C4C4C8 100%)',
                    boxShadow: '0 0 0 1px rgba(255,255,255,0.12), 0 12px 32px rgba(0,0,0,0.4)',
                    transform: 'translateY(-1px)',
                  },
                  '&:active': { transform: 'translateY(0px)' },
                  '&.Mui-disabled': {
                    background: 'rgba(255,255,255,0.08)',
                    color: '#52525B',
                  },
                }}
              >
                {isSubmitting
                  ? <CircularProgress size={16} sx={{ color: '#52525B' }} />
                  : isLogin ? 'Sign in' : 'Create account'}
              </Button>
            </Box>
          </Box>

          {/* Toggle */}
          <Box sx={{ textAlign: 'center', mt: 3.5 }}>
            <Typography variant="body2" color="#52525B">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <Box
                component="span"
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                sx={{
                  fontWeight: 700,
                  color: '#A1A1AA',
                  cursor: 'pointer',
                  transition: 'color 0.15s',
                  '&:hover': { color: '#EDEDED' },
                }}
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </Box>
            </Typography>
          </Box>

          {/* Terms  */}
          <Typography variant="caption" color="#3F3F46" display="block" textAlign="center" mt={3} lineHeight={1.6}>
            By continuing, you agree to our{' '}
            <Box component="span" sx={{ color: '#52525B', cursor: 'pointer', '&:hover': { color: '#A1A1AA' } }}>Terms of Service</Box>
            {' '}and{' '}
            <Box component="span" sx={{ color: '#52525B', cursor: 'pointer', '&:hover': { color: '#A1A1AA' } }}>Privacy Policy</Box>.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
