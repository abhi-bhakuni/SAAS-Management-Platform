import { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Divider, 
  Container, 
  Paper,
  InputAdornment,
  IconButton,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import GoogleIcon from '@mui/icons-material/Google';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import { useAuth } from '../context/AuthContext';

export function Auth() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // split name for user logic if appropriate
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        await register({ email, password, firstName: name || 'User' });
      }
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: '#FAFAFA' 
      }}
    >
      <Container maxWidth="xs">
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
          <Box 
            sx={{ 
              width: { xs: 40, md: 48 }, 
              height: { xs: 40, md: 48 }, 
              borderRadius: '12px', 
              bgcolor: 'text.primary', 
              color: 'background.paper',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3
            }}
          >
            <LayersOutlinedIcon fontSize="medium" />
          </Box>
          <Typography variant="h5" fontWeight="700" color="text.primary" gutterBottom>
            {isLogin ? 'Sign in to AcmeCorp' : 'Create an account'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isLogin ? 'Welcome back! Please enter your details.' : 'Start managing your projects seamlessly.'}
          </Typography>
        </Box>

        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 3, sm: 4 }, 
            borderRadius: '16px', 
            border: '1px solid', 
            borderColor: 'divider',
            boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.05)'
          }}
        >
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          <form onSubmit={handleAuth}>
            {!isLogin && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" fontWeight="600" color="text.secondary" sx={{ display: 'block', mb: 1 }}>Full Name</Typography>
                <TextField 
                  fullWidth 
                  placeholder="Enter your full name" 
                  size="small" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.9rem' } }} 
                />
              </Box>
            )}
            <Box sx={{ mb: 3 }}>
              <Typography variant="caption" fontWeight="600" color="text.secondary" sx={{ display: 'block', mb: 1 }}>Email</Typography>
              <TextField 
                required
                fullWidth 
                type="email"
                placeholder="Enter your email" 
                size="small" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.9rem' } }}
              />
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="caption" fontWeight="600" color="text.secondary" sx={{ display: 'block', mb: 1 }}>Password</Typography>
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
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                        {showPassword ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.9rem' } }}
              />
            </Box>

            {isLogin && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3, mt: -1 }}>
                <Typography variant="caption" fontWeight="600" color="primary.main" sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                  Forgot password?
                </Typography>
              </Box>
            )}

            <Button 
              type="submit"
              fullWidth 
              variant="contained" 
              disableElevation
              sx={{ 
                py: 1.2, 
                borderRadius: '8px', 
                textTransform: 'none', 
                fontWeight: 600,
                bgcolor: 'text.primary',
                color: 'background.paper',
                '&:hover': { bgcolor: 'grey.800' }
              }}
            >
              {isLogin ? 'Sign in' : 'Get started'}
            </Button>
          </form>

          <Box sx={{ display: 'flex', alignItems: 'center', my: 3 }}>
            <Divider sx={{ flexGrow: 1 }} />
            <Typography variant="caption" color="text.secondary" sx={{ mx: 2 }}>or</Typography>
            <Divider sx={{ flexGrow: 1 }} />
          </Box>

          <Button 
            fullWidth 
            variant="outlined" 
            startIcon={<GoogleIcon sx={{ fontSize: 18, color: '#DB4437' }} />}
            sx={{ 
              py: 1.2, 
              borderRadius: '8px', 
              textTransform: 'none', 
              fontWeight: 600,
              color: 'text.primary',
              borderColor: 'divider',
              '&:hover': { bgcolor: 'action.hover', borderColor: 'divider' }
            }}
          >
            Continue with Google
          </Button>

          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="body2" color="text.secondary">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <Box 
                component="span" 
                onClick={() => setIsLogin(!isLogin)}
                sx={{ fontWeight: '600', color: 'text.primary', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
              >
                {isLogin ? 'Sign up' : 'Log in'}
              </Box>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
