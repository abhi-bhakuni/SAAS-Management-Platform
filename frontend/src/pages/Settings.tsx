import { useState, useEffect, type SyntheticEvent } from 'react';
import { useLocation } from 'react-router-dom';
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
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
} from '@mui/material';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { organizationApi, dashboardApi, billingApi, authApi } from '../services/api';
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

type Invite = {
  id: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER';
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  expiresAt: string;
  createdAt: string;
};

export function Settings() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<number>((location.state as any)?.tab ?? 0);
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [pendingInvites, setPendingInvites] = useState<Invite[]>([]);
  const [isMembersLoading, setIsMembersLoading] = useState(false);
  const [isInvitesLoading, setIsInvitesLoading] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'MANAGER' | 'ADMIN'>('MEMBER');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [revokingInviteId, setRevokingInviteId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [updatingRoleMemberId, setUpdatingRoleMemberId] = useState<string | null>(null);
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [subscription, setSubscription] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<any>(null);

  const handleTabChange = (_event: SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  useEffect(() => {
    const fetchMembersAndInvites = async () => {
      if (!user?.selectedOrgId) {
        setMembers([]);
        setPendingInvites([]);
        setProjectCount(null);
        return;
      }

      setIsMembersLoading(true);
      setIsInvitesLoading(true);
      const [membersResult, dashboardResult, invitesResult] = await Promise.allSettled([
        organizationApi.getMembers(1, 50),
        dashboardApi.getStats(),
        organizationApi.getInvites({ status: 'PENDING', page: 1, limit: 50 }),
      ]);

      if (membersResult.status === 'fulfilled') {
        setMembers(membersResult.value?.data ?? []);
      } else {
        console.error('Failed to load team members', membersResult.reason);
        setMembers([]);
      }

      if (dashboardResult.status === 'fulfilled') {
        setProjectCount(dashboardResult.value?.stats?.totalProjects ?? null);
      } else {
        console.error('Failed to load dashboard data', dashboardResult.reason);
        setProjectCount(null);
      }

      if (invitesResult.status === 'fulfilled') {
        setPendingInvites(invitesResult.value?.data ?? []);
      } else {
        // Invite APIs may be restricted to admins; this should not block member list rendering.
        console.warn('Failed to load pending invites', invitesResult.reason);
        setPendingInvites([]);
      }

      setIsMembersLoading(false);
      setIsInvitesLoading(false);
    };

    fetchMembersAndInvites();
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

  useEffect(() => {
    if (!user) {
      setFullName('');
      setBio('');
      return;
    }

    setFullName(`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim());
    setBio(user.bio ?? '');
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const trimmedName = fullName.trim();
      const nameParts = trimmedName.split(' ').filter(Boolean);
      const firstName = nameParts.shift() ?? '';
      const lastName = nameParts.join(' ');

      const payload: { firstName: string; lastName?: string; bio?: string } = {
        firstName,
        bio,
      };

      if (lastName) {
        payload.lastName = lastName;
      }

      const updatedUser = await authApi.updateProfile(user.id, payload);
      updateUser({
        firstName: updatedUser.firstName ?? firstName,
        lastName: updatedUser.lastName ?? lastName,
        bio: updatedUser.bio ?? bio,
      });
      showToast('Profile updated successfully.', 'success');
    } catch (error: unknown) {
      console.error('Failed to save profile information', error);
      showToast('Failed to save profile changes. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const isInviteEmailValid = /\S+@\S+\.\S+/.test(inviteEmail.trim());

  const handleOpenInviteModal = () => {
    setInviteEmail('');
    setInviteRole('MEMBER');
    setIsInviteModalOpen(true);
  };

  const handleCloseInviteModal = () => {
    if (isSendingInvite) return;
    setIsInviteModalOpen(false);
  };

  const loadPendingInvites = async () => {
    if (!user?.selectedOrgId) return;
    setIsInvitesLoading(true);
    try {
      const invitesResponse = await organizationApi.getInvites({
        status: 'PENDING',
        page: 1,
        limit: 50,
      });
      setPendingInvites(invitesResponse?.data ?? []);
    } catch (error) {
      console.error('Failed to load pending invites', error);
      setPendingInvites([]);
    } finally {
      setIsInvitesLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!user?.selectedOrgId) {
      showToast('Select a workspace before inviting members.', 'warning');
      return;
    }
    if (!isInviteEmailValid) {
      showToast('Enter a valid email address.', 'warning');
      return;
    }

    setIsSendingInvite(true);
    try {
      await organizationApi.createInvite({
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
      });
      showToast('Invitation sent successfully.', 'success');
      setIsInviteModalOpen(false);
      await loadPendingInvites();
    } catch (error) {
      console.error('Failed to invite member', error);
      showToast('Failed to send invitation. Please try again.', 'error');
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleChangeRole = async (userId: string, role: 'ADMIN' | 'MANAGER' | 'MEMBER') => {
    setUpdatingRoleMemberId(userId);
    try {
      await organizationApi.updateMemberRole(userId, role);
      setMembers((current) =>
        current.map((m) => (m.userId === userId ? { ...m, role } : m)),
      );
      showToast('Role updated.', 'success');
    } catch (error) {
      console.error('Failed to update role', error);
      showToast('Failed to update role. Please try again.', 'error');
    } finally {
      setUpdatingRoleMemberId(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!user?.selectedOrgId) return;

    setRemovingMemberId(userId);
    try {
      await organizationApi.removeMember(userId);
      setMembers((current) => current.filter((m) => m.userId !== userId));
      showToast('Member removed.', 'success');
    } catch (error) {
      console.error('Failed to remove member', error);
      showToast('Failed to remove member. Please try again.', 'error');
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!user?.selectedOrgId) return;

    setRevokingInviteId(inviteId);
    try {
      await organizationApi.revokeInvite(inviteId);
      setPendingInvites((currentInvites) =>
        currentInvites.filter((invite) => invite.id !== inviteId),
      );
      showToast('Invite revoked.', 'success');
    } catch (error) {
      console.error('Failed to revoke invite', error);
      showToast('Failed to revoke invite. Please try again.', 'error');
    } finally {
      setRevokingInviteId(null);
    }
  };

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
              borderBottom: '1px solid',
              borderColor: 'rgba(255, 255, 255, 0.05)',
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
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    variant="outlined"
                    sx={inputStyle}
                  />
                  <TextField
                    fullWidth
                    label="Email Address"
                    value={user?.email ?? ''}
                    variant="outlined"
                    sx={inputStyle}
                    InputProps={{ readOnly: true }}
                  />
                </Box>
                
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Bio"
                  placeholder="Tell us about yourself..."
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  variant="outlined"
                  sx={inputStyle}
                />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="contained"
                    disableElevation
                    sx={saveButtonStyle}
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving…' : 'Save Changes'}
                  </Button>
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
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={saveButtonStyle}
                    onClick={handleOpenInviteModal}
                    disabled={user?.orgRole !== 'ADMIN'}
                  >
                    Invite Member
                  </Button>
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
                            {user?.orgRole === 'ADMIN' || (user?.orgRole === 'MANAGER' && member.role === 'MEMBER') ? (
                              <Select
                                size="small"
                                value={member.role as 'ADMIN' | 'MANAGER' | 'MEMBER'}
                                disabled={updatingRoleMemberId === member.userId}
                                onChange={(e) => handleChangeRole(member.userId, e.target.value as 'ADMIN' | 'MANAGER' | 'MEMBER')}
                                sx={{
                                  fontSize: '0.875rem',
                                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' },
                                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                                }}
                              >
                                {user?.orgRole === 'ADMIN' && <MenuItem value="ADMIN">Admin</MenuItem>}
                                <MenuItem value="MANAGER">Manager</MenuItem>
                                <MenuItem value="MEMBER">Member</MenuItem>
                              </Select>
                            ) : (
                              <Typography variant="body2">{member.role}</Typography>
                            )}
                          </TableCell>
                          <TableCell sx={cellStyle}>
                            <Chip label="Active" size="small" sx={{ 
                              fontSize: '0.65rem', 
                              fontWeight: 700,
                              backgroundColor: 'rgba(16, 185, 129, 0.1)',
                              color: '#10B981'
                            }} />
                          </TableCell>
                          {user?.orgRole === 'ADMIN' && (
                            <TableCell sx={cellStyle} align="right">
                              <Button
                                size="small"
                                sx={{ color: 'text.disabled', textTransform: 'none' }}
                                onClick={() => handleRemoveMember(member.userId)}
                                disabled={removingMemberId === member.userId}
                              >
                                {removingMemberId === member.userId ? 'Removing…' : 'Remove'}
                              </Button>
                            </TableCell>
                          )}
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

                {user?.orgRole === 'ADMIN' && <Box sx={{ mt: 4 }}>
                  <Typography variant="subtitle1" fontWeight="700" mb={2}>
                    Pending Invitations
                  </Typography>
                  <TableContainer
                    sx={{
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      backgroundColor: 'rgba(255, 255, 255, 0.01)',
                    }}
                  >
                    <Table>
                      <TableHead sx={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                        <TableRow>
                          <TableCell sx={headerCellStyle}>Email</TableCell>
                          <TableCell sx={headerCellStyle}>Role</TableCell>
                          <TableCell sx={headerCellStyle}>Expires</TableCell>
                          <TableCell sx={headerCellStyle}></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {isInvitesLoading ? (
                          <TableRow>
                            <TableCell colSpan={4} sx={{ py: 3, textAlign: 'center' }}>
                              <Typography color="text.disabled">Loading invites…</Typography>
                            </TableCell>
                          </TableRow>
                        ) : pendingInvites.length > 0 ? (
                          pendingInvites.map((invite) => (
                            <TableRow key={invite.id}>
                              <TableCell sx={cellStyle}>
                                <Typography variant="body2">{invite.email}</Typography>
                              </TableCell>
                              <TableCell sx={cellStyle}>
                                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                  {invite.role}
                                </Typography>
                              </TableCell>
                              <TableCell sx={cellStyle}>
                                <Typography variant="body2" color="text.secondary">
                                  {new Date(invite.expiresAt).toLocaleDateString()}
                                </Typography>
                              </TableCell>
                              <TableCell sx={cellStyle} align="right">
                                <Button
                                  size="small"
                                  sx={{ color: 'text.disabled', textTransform: 'none' }}
                                  onClick={() => handleRevokeInvite(invite.id)}
                                  disabled={revokingInviteId === invite.id}
                                >
                                  {revokingInviteId === invite.id ? 'Revoking…' : 'Revoke'}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} sx={{ py: 3, textAlign: 'center' }}>
                              <Typography color="text.disabled">
                                No pending invitations.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>}
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

      <Dialog
        open={isInviteModalOpen}
        onClose={handleCloseInviteModal}
        PaperProps={{
          elevation: 0,
          sx: {
            borderRadius: '12px',
            width: '100%',
            maxWidth: 440,
            backgroundColor: '#18181B',
            border: '1px solid',
            borderColor: '#2A2A2E',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#FFFFFF', pb: 1, pt: 3 }}>
          Invite Member
        </DialogTitle>
        <DialogContent sx={{ pb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Send an invite to join this workspace.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Email Address"
            placeholder="teammate@company.com"
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
            size="small"
            sx={{ mb: 2, ...inputStyle }}
          />
          <TextField
            select
            fullWidth
            label="Role"
            value={inviteRole}
            onChange={(event) => setInviteRole(event.target.value as 'ADMIN' | 'MANAGER' | 'MEMBER')}
            size="small"
            sx={inputStyle}
          >
            <MenuItem value="MEMBER">Member</MenuItem>
            <MenuItem value="MANAGER">Manager</MenuItem>
            <MenuItem value="ADMIN">Admin</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={handleCloseInviteModal}
            disabled={isSendingInvite}
            sx={{ color: 'text.disabled', textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disableElevation
            onClick={handleInviteMember}
            disabled={isSendingInvite || !isInviteEmailValid}
            sx={saveButtonStyle}
          >
            {isSendingInvite ? 'Sending…' : 'Send Invite'}
          </Button>
        </DialogActions>
      </Dialog>
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
