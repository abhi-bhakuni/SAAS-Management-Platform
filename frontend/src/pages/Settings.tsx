import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  Divider, 
  Button, 
  Tabs, 
  Tab, 
  TextField, 
  Avatar, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  LinearProgress
} from '@mui/material';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { organizationApi, dashboardApi, billingApi } from '../services/api';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import AddIcon from '@mui/icons-material/Add';

type Member = {
  userId: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

export function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [members, setMembers] = useState<Member[]>([]);
  const [isMembersLoading, setIsMembersLoading] = useState(false);
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [subscription, setSubscription] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<any>(null);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  useEffect(() => {
    const fetchMembers = async () => {
      if (!user?.selectedOrgId) {
        setMembers([]);
        setProjectCount(null);
        return;
      }

      setIsMembersLoading(true);
      try {
        const [membersResponse, dashboardResponse] = await Promise.all([
          organizationApi.getMembers(1, 50),
          dashboardApi.getStats(user.selectedOrgId),
        ]);
        setMembers(membersResponse.data ?? []);
        setProjectCount(dashboardResponse?.stats?.totalProjects ?? null);
      } catch (error) {
        console.error('Failed to load team members or dashboard data', error);
        setMembers([]);
        setProjectCount(null);
      } finally {
        setIsMembersLoading(false);
      }
    };

    fetchMembers();
  }, [user?.selectedOrgId]);

  useEffect(() => {
    const fetchBillingData = async () => {
      if (!user?.id) {
        setSubscription(null);
        setPaymentMethod(null);
        return;
      }

      try {
        const billingResponse = await billingApi.getMySubscription();
        setSubscription(billingResponse.subscription ?? null);
        setPaymentMethod(billingResponse.paymentMethod ?? null);
      } catch (error) {
        console.error('Failed to load billing information', error);
        setSubscription(null);
        setPaymentMethod(null);
      }
    };

    fetchBillingData();
  }, [user?.id]);

  const currentPlan = subscription?.subscriptionPlan;
  const currentPlanName = currentPlan?.name ?? 'Free Tier';
  const currentPlanDescription = currentPlan?.description ?? 'Perfect for individual developers and small experiments.';
  const currentPlanPrice = Number(currentPlan?.price ?? 0);
  const currentPlanBillingCycle = currentPlan?.billingCycle ?? 'month';
  const projectLimit = Number(currentPlan?.limits?.projects ?? 5);
  const paymentMethodLabel = paymentMethod?.card
    ? `${paymentMethod.card.brand?.toUpperCase() ?? 'Card'} ending in ${paymentMethod.card.last4}`
    : 'No payment method on file';
  const paymentMethodExpiry = paymentMethod?.card ? `${paymentMethod.card.exp_month}/${paymentMethod.card.exp_year}` : null;
  const nextBillingDate = subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : null;

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#0F0F11', overflow: 'hidden' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header */}
        <Box sx={{ 
          p: { xs: 3, md: 5 }, 
          pb: 0,
          borderBottom: '1px solid',
          borderColor: 'rgba(255, 255, 255, 0.05)',
          backgroundColor: '#0F0F11'
        }}>
          <Typography variant="h4" fontWeight="800" sx={{ letterSpacing: '-0.02em', mb: 1 }}>
            Settings
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={4}>
            Configure your account, team permissions, and subscription preferences.
          </Typography>

          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            sx={{ 
              '& .MuiTab-root': { 
                textTransform: 'none', 
                fontWeight: 600, 
                fontSize: '0.9rem',
                minWidth: 100,
                color: 'text.disabled',
                '&.Mui-selected': { color: '#FFFFFF' }
              },
              '& .MuiTabs-indicator': { backgroundColor: '#FFFFFF', height: 2, borderRadius: '2px 2px 0 0' }
            }}
          >
            <Tab icon={<PersonOutlineIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Profile" />
            <Tab icon={<GroupOutlinedIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Members" />
            <Tab icon={<CreditCardOutlinedIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Billing" />
            <Tab icon={<SecurityOutlinedIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Security" />
          </Tabs>
        </Box>

        {/* Scrollable Content */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: { xs: 3, md: 5 } }}>
          <Box sx={{ maxWidth: 800, mx: 'auto' }}>
            
            {/* PROFILE SECTION */}
            {activeTab === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Typography variant="h6" fontWeight="700">Personal Information</Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar
                      sx={{ width: 80, height: 80, border: '2px solid rgba(255, 255, 255, 0.1)' }}
                      src={`https://i.pravatar.cc/150?u=${user?.email ?? 'profile'}`}
                    />
                    <Button 
                      size="small" 
                      sx={{ 
                        position: 'absolute', 
                        bottom: -10, 
                        left: '50%', 
                        transform: 'translateX(-50%)',
                        backgroundColor: '#18181B',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        textTransform: 'none',
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        py: 0.2,
                        '&:hover': { backgroundColor: '#27272A' }
                      }}
                    >
                      Change
                    </Button>
                  </Box>
                  <Box>
                    <Typography variant="body1" fontWeight="700">Display Avatar</Typography>
                    <Typography variant="body2" color="text.disabled">This will be displayed on your profile and tasks.</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    defaultValue={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()}
                    variant="outlined"
                    sx={inputStyle}
                  />
                  <TextField
                    fullWidth
                    label="Email Address"
                    defaultValue={user?.email ?? ''}
                    variant="outlined"
                    sx={inputStyle}
                  />
                </Box>
                
                <TextField fullWidth multiline rows={3} label="Bio" placeholder="Tell us about yourself..." variant="outlined" sx={inputStyle} />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button variant="contained" disableElevation sx={saveButtonStyle}>Save Changes</Button>
                </Box>
              </Box>
            )}

            {/* MEMBERS SECTION */}
            {activeTab === 1 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                  <Box>
                    <Typography variant="h6" fontWeight="700">Team Members</Typography>
                    <Typography variant="body2" color="text.disabled">Manage who has access to this workspace.</Typography>
                  </Box>
                  <Button variant="contained" startIcon={<AddIcon />} sx={saveButtonStyle}>Invite Member</Button>
                </Box>

                <TableContainer sx={{ 
                  borderRadius: '12px', 
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  backgroundColor: 'rgba(255, 255, 255, 0.01)'
                }}>
                  <Table>
                    <TableHead sx={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                      <TableRow>
                        <TableCell sx={headerCellStyle}>Member</TableCell>
                        <TableCell sx={headerCellStyle}>Role</TableCell>
                        <TableCell sx={headerCellStyle}>Status</TableCell>
                        <TableCell sx={headerCellStyle}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                    {isMembersLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} sx={{ py: 4, textAlign: 'center' }}>
                          <Typography color="text.disabled">Loading members…</Typography>
                        </TableCell>
                      </TableRow>
                    ) : members.length > 0 ? (
                      members.map((member) => (
                        <TableRow key={member.userId}>
                          <TableCell sx={cellStyle}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ width: 32, height: 32 }} src={`https://i.pravatar.cc/150?u=${member.user.email}`} />
                              <Box>
                                <Typography variant="body2" fontWeight="700">{`${member.user.firstName} ${member.user.lastName ?? ''}`}</Typography>
                                <Typography variant="caption" color="text.disabled">{member.user.email}</Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell sx={cellStyle}>
                            <Typography variant="body2">{member.role}</Typography>
                          </TableCell>
                          <TableCell sx={cellStyle}>
                            <Chip label="Active" size="small" sx={{ 
                              fontSize: '0.65rem', 
                              fontWeight: 700,
                              backgroundColor: 'rgba(16, 185, 129, 0.1)',
                              color: '#10B981'
                            }} />
                          </TableCell>
                          <TableCell sx={cellStyle} align="right">
                            <Button size="small" sx={{ color: 'text.disabled', textTransform: 'none' }}>Remove</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} sx={{ py: 4, textAlign: 'center' }}>
                          <Typography color="text.disabled">No members found for this organization.</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* BILLING SECTION */}
            {activeTab === 2 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Box>
                  <Typography variant="h6" fontWeight="700">Subscription & Billing</Typography>
                  <Typography variant="body2" color="text.disabled">Select the plan that fits your team's needs.</Typography>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  <Card sx={{ 
                    p: 4, 
                    borderRadius: '16px', 
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                  }}>
                    <Typography variant="subtitle2" sx={{ color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Current Plan</Typography>
                    <Typography variant="h4" fontWeight="800">{currentPlanName}</Typography>
                    <Typography variant="body2" color="text.secondary">{currentPlanDescription}</Typography>
                    <Divider sx={{ my: 1, opacity: 0.05 }} />
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" color="text.disabled">Projects</Typography>
                        <Typography variant="caption" fontWeight="700">{projectCount !== null ? `${projectCount} / ${projectLimit}` : `— / ${projectLimit}`}</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={projectCount === null ? 0 : Math.min((projectCount / projectLimit) * 100, 100)} sx={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255, 255, 255, 0.05)', '& .MuiLinearProgress-bar': { backgroundColor: '#FFFFFF' } }} />
                    </Box>
                  </Card>

                  <Card sx={{ 
                    p: 4, 
                    borderRadius: '16px', 
                    border: '2px solid #FFFFFF',
                    backgroundColor: '#FFFFFF',
                    color: '#000000',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    boxShadow: '0 20px 40px rgba(255, 255, 255, 0.1)'
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle2" sx={{ opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Upgrade</Typography>
                      <Chip label="POPULAR" size="small" sx={{ fontWeight: 800, fontSize: '0.65rem', backgroundColor: '#0F0F11', color: '#FFFFFF' }} />
                    </Box>
                    <Typography variant="h4" fontWeight="800">Pro Plan</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Scale your team with unlimited projects and advanced analytics.</Typography>
                    <Divider sx={{ my: 1, opacity: 0.1, backgroundColor: '#000000' }} />
                    <Typography variant="h5" fontWeight="800">
                      {currentPlanPrice > 0 ? `$${currentPlanPrice}` : 'Free'}
                      {currentPlanPrice > 0 && (
                        <Box component="span" sx={{ fontSize: '1rem', fontWeight: 500, opacity: 0.6 }}>/ {currentPlanBillingCycle}</Box>
                      )}
                    </Typography>
                    <Button variant="contained" disableElevation sx={{ mt: 'auto', backgroundColor: '#000000', color: '#FFFFFF', fontWeight: 800, textTransform: 'none', borderRadius: '8px', py: 1, '&:hover': { backgroundColor: '#27272A' } }}>
                      Select Pro 
                    </Button>
                  </Card>
                </Box>

                <Box>
                  <Typography variant="subtitle1" fontWeight="700" mb={2}>Payment Method</Typography>
                  <Box sx={{ p: 2, borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CreditCardOutlinedIcon sx={{ color: 'text.disabled' }} />
                    <Box>
                      <Typography variant="body2" fontWeight="600">{paymentMethodLabel}</Typography>
                      <Typography variant="caption" color="text.disabled">
                        {paymentMethod
                          ? paymentMethodExpiry
                            ? `Expires ${paymentMethodExpiry}`
                            : nextBillingDate
                              ? `Next billing ${nextBillingDate}`
                              : 'Payment method is on file'
                          : 'Update your billing information to enable paid plans.'}
                      </Typography>
                    </Box>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button size="small" sx={{ color: 'text.disabled' }}>Update</Button>
                  </Box>
                </Box>
              </Box>
            )}

          </Box>
        </Box>
      </Box>
    </Box>
  );
}

const inputStyle = {
  '& .MuiOutlinedInput-root': { 
    borderRadius: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.05)' },
    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
    '&.Mui-focused fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' }
  },
  '& .MuiInputLabel-root': { color: 'text.disabled' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#FFFFFF' }
};

const saveButtonStyle = {
  borderRadius: '8px',
  textTransform: 'none',
  fontWeight: 700,
  px: 4,
  py: 1,
  backgroundColor: '#FFFFFF',
  color: '#000000',
  '&:hover': { backgroundColor: '#E2E2E2' }
};

const headerCellStyle = {
  fontWeight: 700, 
  color: 'text.disabled', 
  fontSize: '0.7rem', 
  textTransform: 'uppercase', 
  letterSpacing: '0.05em', 
  borderBottom: '1px solid', 
  borderColor: 'rgba(255, 255, 255, 0.05)', 
  py: 2, 
  px: 3 
};

const cellStyle = {
  py: 2.5, 
  px: 3, 
  borderBottom: '1px solid', 
  borderColor: 'rgba(255, 255, 255, 0.02)' 
};
