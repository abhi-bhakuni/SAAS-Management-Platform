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
import { useAuth, validatePassword, hashPassword } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { organizationApi, dashboardApi, billingApi, authApi, securityApi } from '../services/api';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';

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
  const [inviteToRevoke, setInviteToRevoke] = useState<Invite | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [updatingRoleMemberId, setUpdatingRoleMemberId] = useState<string | null>(null);
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [subscription, setSubscription] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isCancelLoading, setIsCancelLoading] = useState(false);

  // Security tab state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [is2FASetupMode, setIs2FASetupMode] = useState(false);
  const [is2FALoading, setIs2FALoading] = useState(false);
  const [isCloseOrgDialogOpen, setIsCloseOrgDialogOpen] = useState(false);
  const [closeOrgConfirmText, setCloseOrgConfirmText] = useState('');
  const [isCloseOrgLoading, setIsCloseOrgLoading] = useState(false);
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] = useState(false);
  const [isDeleteAccountLoading, setIsDeleteAccountLoading] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState('');

  const handleTabChange = (_event: SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  useEffect(() => {
    if (user?.orgRole !== 'ADMIN' && activeTab === 2) {
      setActiveTab(0);
    }
  }, [user?.orgRole, activeTab]);

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

  const fetchBillingData = async () => {
    if (!user?.id) { setSubscription(null); setPaymentMethod(null); return; }
    try {
      const res = await billingApi.getMySubscription();
      setSubscription(res.subscription ?? null);
      setPaymentMethod(res.paymentMethod ?? null);
    } catch (error) {
      console.error('Failed to load billing information', error);
      setSubscription(null);
      setPaymentMethod(null);
    }
  };

  useEffect(() => { fetchBillingData(); }, [user?.id]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { plans: fetched } = await billingApi.getPlans();
        setPlans(fetched ?? []);
      } catch (error) {
        console.error('Failed to load plans', error);
      }
    };
    fetchPlans();
  }, []);

  // Handle return from Stripe Checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('checkout');
    const sessionId = params.get('session_id');
    if (status === 'success') {
      window.history.replaceState({}, '', window.location.pathname);
      setActiveTab(2);
      const syncAndRefresh = async () => {
        try {
          if (sessionId) {
            await billingApi.syncCheckoutSession(sessionId);
          }
          await fetchBillingData();
          showToast('Subscription activated successfully!', 'success');
        } catch {
          showToast('Subscription activated. Refreshing billing info...', 'info');
          await fetchBillingData();
        }
      };
      syncAndRefresh();
    } else if (status === 'canceled') {
      showToast('Checkout was canceled.', 'info');
      setActiveTab(2);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

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

  const handleRemoveMember = (member: Member) => {
    setMemberToRemove(member);
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove || !user?.selectedOrgId) return;

    setRemovingMemberId(memberToRemove.userId);
    try {
      await organizationApi.removeMember(memberToRemove.userId);
      setMembers((current) => current.filter((m) => m.userId !== memberToRemove.userId));
      showToast('Member removed.', 'success');
    } catch (error) {
      console.error('Failed to remove member', error);
      showToast('Failed to remove member. Please try again.', 'error');
    } finally {
      setRemovingMemberId(null);
      setMemberToRemove(null);
    }
  };

  const handleRevokeInvite = (invite: Invite) => {
    setInviteToRevoke(invite);
  };

  const confirmRevokeInvite = async () => {
    if (!inviteToRevoke || !user?.selectedOrgId) return;

    setRevokingInviteId(inviteToRevoke.id);
    try {
      await organizationApi.revokeInvite(inviteToRevoke.id);
      setPendingInvites((current) => current.filter((i) => i.id !== inviteToRevoke.id));
      showToast('Invite revoked.', 'success');
    } catch (error) {
      console.error('Failed to revoke invite', error);
      showToast('Failed to revoke invite. Please try again.', 'error');
    } finally {
      setRevokingInviteId(null);
      setInviteToRevoke(null);
    }
  };

  const handleUpgrade = async (planId: string) => {
    setIsCheckoutLoading(true);
    try {
      const { url } = await billingApi.createCheckoutSession(planId);
      window.location.href = url;
    } catch (error) {
      console.error('Checkout failed', error);
      showToast('Failed to start checkout. Please try again.', 'error');
      setIsCheckoutLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsPortalLoading(true);
    try {
      const { url } = await billingApi.createPortalSession();
      window.location.href = url;
    } catch (error) {
      console.error('Billing portal failed', error);
      showToast('Failed to open billing portal. Please try again.', 'error');
      setIsPortalLoading(false);
    }
  };

  const currentPlan = subscription?.subscriptionPlan;
  const currentPlanName = currentPlan?.name ?? 'Free Tier';
  const currentPlanDescription = currentPlan?.description ?? 'Perfect for individual developers and small experiments.';
  const projectLimit = Number(currentPlan?.limits?.projects ?? 5);
  const taskLimit = Number(currentPlan?.limits?.tasks ?? 20);
  const userLimit = Number(currentPlan?.limits?.users ?? 5);

  // Sync 2FA status from server-returned user object
  useEffect(() => {
    setTwoFactorEnabled(user?.twoFactorEnabled ?? false);
  }, [user?.twoFactorEnabled]);

  // Security handlers
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) { showToast('New passwords do not match.', 'error'); return; }
    const validation = validatePassword(newPassword);
    if (!validation.isValid) { showToast(validation.message, 'error'); return; }
    setIsPasswordSaving(true);
    try {
      const [hashedCurrent, hashedNew] = await Promise.all([
        hashPassword(currentPassword),
        hashPassword(newPassword),
      ]);
      await securityApi.changePassword(hashedCurrent, hashedNew);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      showToast('Password changed successfully.', 'success');
    } catch { showToast('Failed to change password. Check your current password.', 'error'); }
    finally { setIsPasswordSaving(false); }
  };

  const handleDeleteAccount = async () => {
    setIsDeleteAccountLoading(true);
    setDeleteAccountError('');
    try {
      await securityApi.deleteAccount();
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } catch (error: any) {
      setDeleteAccountError(error?.response?.data?.message ?? 'Failed to delete account.');
      setIsDeleteAccountLoading(false);
    }
  };

  const handleGenerate2FA = async () => {
    setIs2FALoading(true);
    try {
      const { qrCodeUrl: qr } = await securityApi.generate2FA();
      setQrCodeUrl(qr); setIs2FASetupMode(true); setTwoFactorToken('');
    } catch { showToast('Failed to generate 2FA setup.', 'error'); }
    finally { setIs2FALoading(false); }
  };

  const handleEnable2FA = async () => {
    if (twoFactorToken.length !== 6) { showToast('Enter the 6-digit code from your authenticator app.', 'error'); return; }
    setIs2FALoading(true);
    try {
      await securityApi.enable2FA(twoFactorToken);
      setTwoFactorEnabled(true); setIs2FASetupMode(false); setQrCodeUrl(''); setTwoFactorToken('');
      showToast('Two-factor authentication enabled.', 'success');
    } catch { showToast('Invalid code. Please try again.', 'error'); }
    finally { setIs2FALoading(false); }
  };

  const handleDisable2FA = async () => {
    if (twoFactorToken.length !== 6) { showToast('Enter the 6-digit code to confirm.', 'error'); return; }
    setIs2FALoading(true);
    try {
      await securityApi.disable2FA(twoFactorToken);
      setTwoFactorEnabled(false); setTwoFactorToken('');
      showToast('Two-factor authentication disabled.', 'info');
    } catch { showToast('Invalid code. Please try again.', 'error'); }
    finally { setIs2FALoading(false); }
  };

  const handleCloseOrganization = async () => {
    setIsCloseOrgLoading(true);
    try {
      await securityApi.closeOrganization();
      localStorage.removeItem('authToken'); localStorage.removeItem('user');
      window.location.href = '/login';
    } catch { showToast('Failed to delete organization.', 'error'); setIsCloseOrgLoading(false); }
  };

  const handleCancelSubscription = async () => {
    setIsCancelLoading(true);
    try {
      await billingApi.cancelSubscription();
      await fetchBillingData();
      setIsCancelDialogOpen(false);
      showToast('Subscription will cancel at the end of the billing period.', 'info');
    } catch {
      showToast('Failed to cancel subscription. Please try again.', 'error');
    } finally {
      setIsCancelLoading(false);
    }
  };

  const paymentMethodLabel = paymentMethod?.card
    ? `${paymentMethod.card.brand?.toUpperCase() ?? 'Card'} ending in ${paymentMethod.card.last4}`
    : 'No payment method on file';
  const paymentMethodExpiry = paymentMethod?.card ? `${paymentMethod.card.exp_month}/${paymentMethod.card.exp_year}` : null;
  const nextBillingDate = subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : null;

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#0F0F11', overflow: 'hidden', pt: { xs: '56px', md: 0 } }}>
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
            <Tab icon={<CreditCardOutlinedIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Billing" sx={{ display: user?.orgRole !== 'ADMIN' ? 'none' : undefined }} />
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
                    slotProps={{ input: { readOnly: true } }}
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
                                onClick={() => handleRemoveMember(member)}
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
                                  onClick={() => handleRevokeInvite(invite)}
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
            {activeTab === 2 && (() => {
              const upgradePlan = plans.find(p => p.id !== currentPlan?.id && p.type !== 'free');
              const isOnPaidPlan = !!subscription && subscription.status === 'active' && currentPlan?.type !== 'free';
              const isCanceling = subscription?.cancelAtPeriodEnd;
              return (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="h6" fontWeight="700">Subscription & Billing</Typography>
                      <Typography variant="body2" color="text.disabled">Select the plan that fits your team's needs.</Typography>
                    </Box>
                    {(isOnPaidPlan || subscription?.stripeCustomerId) && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleManageSubscription}
                        disabled={isPortalLoading}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 600,
                          borderColor: 'rgba(255,255,255,0.15)',
                          color: 'text.secondary',
                          borderRadius: '8px',
                          '&:hover': { borderColor: 'rgba(255,255,255,0.4)', color: '#FFFFFF' },
                        }}
                      >
                        {isPortalLoading ? 'Opening…' : 'Manage Subscription'}
                      </Button>
                    )}
                  </Box>

                  {isCanceling && (
                    <Box sx={{ p: 2, borderRadius: '8px', backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <Typography variant="body2" sx={{ color: '#EF4444', fontWeight: 600 }}>
                        Your subscription will cancel on {nextBillingDate}. Click "Manage Subscription" to reactivate.
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    {/* Current Plan */}
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
                        <LinearProgress
                          variant="determinate"
                          value={projectCount === null ? 0 : Math.min((projectCount / projectLimit) * 100, 100)}
                          sx={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.05)', '& .MuiLinearProgress-bar': { backgroundColor: '#FFFFFF' } }}
                        />
                      </Box>
                      {isOnPaidPlan && (
                        <Typography variant="caption" color="text.disabled" sx={{ mt: 'auto' }}>
                          {nextBillingDate ? `Renews ${nextBillingDate}` : 'Active'}
                        </Typography>
                      )}
                    </Card>

                    {/* Upgrade / Pro Plan */}
                    {upgradePlan ? (
                      <Card sx={{
                        p: 4,
                        borderRadius: '16px',
                        border: '2px solid #FFFFFF',
                        backgroundColor: '#FFFFFF',
                        color: '#000000',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        boxShadow: '0 20px 40px rgba(255,255,255,0.1)'
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle2" sx={{ opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Upgrade</Typography>
                          <Chip label="POPULAR" size="small" sx={{ fontWeight: 800, fontSize: '0.65rem', backgroundColor: '#0F0F11', color: '#FFFFFF' }} />
                        </Box>
                        <Typography variant="h4" fontWeight="800">{upgradePlan.name}</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>{upgradePlan.description ?? 'Scale your team with advanced features.'}</Typography>
                        <Divider sx={{ my: 1, opacity: 0.1, backgroundColor: '#000000' }} />
                        <Typography variant="h5" fontWeight="800">
                          {Number(upgradePlan.price) > 0 ? `$${Number(upgradePlan.price).toFixed(2)}` : 'Free'}
                          {Number(upgradePlan.price) > 0 && (
                            <Box component="span" sx={{ fontSize: '1rem', fontWeight: 500, opacity: 0.6 }}>/ {upgradePlan.billingCycle ?? 'month'}</Box>
                          )}
                        </Typography>
                        <Button
                          variant="contained"
                          disableElevation
                          onClick={() => handleUpgrade(upgradePlan.id)}
                          disabled={isCheckoutLoading}
                          sx={{ mt: 'auto', backgroundColor: '#000000', color: '#FFFFFF', fontWeight: 800, textTransform: 'none', borderRadius: '8px', py: 1, '&:hover': { backgroundColor: '#27272A' } }}
                        >
                          {isCheckoutLoading ? 'Redirecting…' : `Upgrade to ${upgradePlan.name}`}
                        </Button>
                      </Card>
                    ) : isOnPaidPlan ? (
                      <Card sx={{
                        p: 4,
                        borderRadius: '16px',
                        border: '1px solid rgba(16,185,129,0.3)',
                        background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(5,150,105,0.06) 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2.5,
                        position: 'relative',
                        overflow: 'hidden',
                      }}>
                        {/* Glow accent */}
                        <Box sx={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', filter: 'blur(40px)', pointerEvents: 'none' }} />

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ p: 1, borderRadius: '10px', backgroundColor: 'rgba(16,185,129,0.15)', display: 'flex' }}>
                            <WorkspacePremiumIcon sx={{ color: '#10B981', fontSize: 22 }} />
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                              Active Plan
                            </Typography>
                            <Typography variant="h6" fontWeight="800" sx={{ color: '#FFFFFF', lineHeight: 1.2 }}>
                              You're on the top plan
                            </Typography>
                          </Box>
                        </Box>

                        <Divider sx={{ borderColor: 'rgba(16,185,129,0.15)' }} />

                        {[
                          `Up to ${projectLimit} projects`,
                          `Up to ${taskLimit} tasks`,
                          `Up to ${userLimit} team members`,
                          'Advanced team collaboration',
                          'Priority support',
                        ].map((feature) => (
                          <Box key={feature} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <CheckCircleIcon sx={{ color: '#10B981', fontSize: 18, flexShrink: 0 }} />
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>{feature}</Typography>
                          </Box>
                        ))}

                        <Box sx={{ mt: 'auto', pt: 1.5, borderTop: '1px solid rgba(16,185,129,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          {nextBillingDate && (
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                              Renews <Box component="span" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{nextBillingDate}</Box>
                            </Typography>
                          )}
                          {!isCanceling && (
                            <Button
                              size="small"
                              onClick={() => setIsCancelDialogOpen(true)}
                              sx={{ color: 'rgba(239,68,68,0.6)', textTransform: 'none', fontSize: '0.75rem', p: 0, minWidth: 0, '&:hover': { color: '#EF4444', backgroundColor: 'transparent' } }}
                            >
                              Cancel plan
                            </Button>
                          )}
                        </Box>
                      </Card>
                    ) : null}
                  </Box>

                  {/* Payment Method */}
                  <Box>
                    <Typography variant="subtitle1" fontWeight="700" mb={2}>Payment Method</Typography>
                    <Box sx={{ p: 2.5, borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 2 }}>
                      <CreditCardOutlinedIcon sx={{ color: 'text.disabled' }} />
                      <Box>
                        <Typography variant="body2" fontWeight="600">{paymentMethodLabel}</Typography>
                        <Typography variant="caption" color="text.disabled">
                          {paymentMethod
                            ? paymentMethodExpiry ? `Expires ${paymentMethodExpiry}` : nextBillingDate ? `Next billing ${nextBillingDate}` : 'Payment method on file'
                            : 'No payment method. Upgrade to add one.'}
                        </Typography>
                      </Box>
                      <Box sx={{ flexGrow: 1 }} />
                      <Button
                        size="small"
                        onClick={handleManageSubscription}
                        disabled={isPortalLoading}
                        sx={{ color: 'text.disabled', textTransform: 'none', '&:hover': { color: '#FFFFFF' } }}
                      >
                        {isPortalLoading ? 'Opening…' : 'Update'}
                      </Button>
                    </Box>
                  </Box>
                </Box>
              );
            })()}

            {activeTab === 3 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>

                {/* 1 — Password Management */}
                <Box>
                  <Typography variant="h6" fontWeight="700" mb={0.5}>Password</Typography>
                  <Typography variant="body2" color="text.disabled" mb={3}>Update your account password.</Typography>
                  {twoFactorEnabled ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 480 }}>
                      <TextField
                        label="Current password" type={showCurrentPw ? 'text' : 'password'} fullWidth size="small"
                        value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} sx={inputStyle}
                        slotProps={{ input: { endAdornment: (
                          <IconButton size="small" onClick={() => setShowCurrentPw(v => !v)} sx={{ color: 'text.disabled' }}>
                            {showCurrentPw ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                          </IconButton>
                        ) } }}
                      />
                      <TextField
                        label="New password" type={showNewPw ? 'text' : 'password'} fullWidth size="small"
                        value={newPassword} onChange={e => setNewPassword(e.target.value)} sx={inputStyle}
                        slotProps={{ input: { endAdornment: (
                          <IconButton size="small" onClick={() => setShowNewPw(v => !v)} sx={{ color: 'text.disabled' }}>
                            {showNewPw ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                          </IconButton>
                        ) } }}
                      />
                      <TextField
                        label="Confirm new password" type="password" fullWidth size="small"
                        value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} sx={inputStyle}
                        error={confirmPassword.length > 0 && confirmPassword !== newPassword}
                        helperText={confirmPassword.length > 0 && confirmPassword !== newPassword ? 'Passwords do not match' : ''}
                      />
                      <Button
                        variant="contained" disableElevation onClick={handleChangePassword}
                        disabled={isPasswordSaving || !currentPassword || !newPassword || !confirmPassword}
                        sx={{ alignSelf: 'flex-start', textTransform: 'none', fontWeight: 700, borderRadius: '8px', backgroundColor: '#FFFFFF', color: '#000000', '&:hover': { backgroundColor: '#E4E4E7' } }}
                      >
                        {isPasswordSaving ? <CircularProgress size={18} sx={{ color: '#000' }} /> : 'Update password'}
                      </Button>
                    </Box>
                  ) : (
                    <Box sx={{ p: 2.5, borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: 2, maxWidth: 480 }}>
                      <PhoneIphoneIcon sx={{ color: 'text.disabled', flexShrink: 0 }} />
                      <Typography variant="body2" color="text.disabled">
                        Enable Two-Factor Authentication first to manage your password.
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Divider sx={{ opacity: 0.06 }} />

                {/* 2 — Two-Factor Authentication */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                    <PhoneIphoneIcon sx={{ color: twoFactorEnabled ? '#10B981' : 'text.disabled', fontSize: 22 }} />
                    <Typography variant="h6" fontWeight="700">Two-Factor Authentication</Typography>
                    {twoFactorEnabled && <Chip label="Enabled" size="small" sx={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#10B981', fontWeight: 700, fontSize: '0.7rem' }} />}
                  </Box>
                  <Typography variant="body2" color="text.disabled" mb={3}>
                    Add an extra layer of security using an authenticator app (Google Authenticator, Authy, etc.).
                  </Typography>

                  {!twoFactorEnabled && !is2FASetupMode && (
                    <Button variant="outlined" onClick={handleGenerate2FA} disabled={is2FALoading}
                      sx={{ textTransform: 'none', fontWeight: 600, borderColor: 'rgba(255,255,255,0.15)', color: '#FFFFFF', borderRadius: '8px', '&:hover': { borderColor: 'rgba(255,255,255,0.4)' } }}>
                      {is2FALoading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Enable 2FA'}
                    </Button>
                  )}

                  {is2FASetupMode && qrCodeUrl && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 340 }}>
                      <Typography variant="body2" color="text.secondary">
                        Scan this QR code with your authenticator app, then enter the 6-digit code below.
                      </Typography>
                      <Box sx={{ p: 2, backgroundColor: '#FFFFFF', borderRadius: '12px', display: 'inline-flex', alignSelf: 'flex-start' }}>
                        <img src={qrCodeUrl} alt="2FA QR code" width={180} height={180} />
                      </Box>
                      <TextField
                        label="6-digit code" fullWidth size="small" value={twoFactorToken}
                        onChange={e => setTwoFactorToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        inputProps={{ maxLength: 6 }} sx={inputStyle}
                        placeholder="000000"
                      />
                      <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Button variant="contained" disableElevation onClick={handleEnable2FA} disabled={is2FALoading || twoFactorToken.length !== 6}
                          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', backgroundColor: '#10B981', color: '#fff', '&:hover': { backgroundColor: '#059669' } }}>
                          {is2FALoading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Verify & Activate'}
                        </Button>
                        <Button onClick={() => { setIs2FASetupMode(false); setQrCodeUrl(''); setTwoFactorToken(''); }}
                          sx={{ textTransform: 'none', color: 'text.disabled', '&:hover': { color: '#fff' } }}>Cancel</Button>
                      </Box>
                    </Box>
                  )}

                  {twoFactorEnabled && (
                    <Typography variant="body2" color="text.disabled">
                      2FA is active. Contact support if you need to disable it.
                    </Typography>
                  )}
                </Box>

                <Divider sx={{ opacity: 0.06 }} />

                {/* 3 — Login Activity */}
                <Box>
                  <Typography variant="h6" fontWeight="700" mb={0.5}>Login Activity</Typography>
                  <Typography variant="body2" color="text.disabled" mb={3}>Recent sign-ins to your account.</Typography>
                  <Box sx={{ p: 2.5, borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" fontWeight="600">Last sign-in</Typography>
                      <Typography variant="caption" color="text.disabled">
                        {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'No login recorded'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Divider sx={{ opacity: 0.06 }} />

                {/* 4 — Danger Zone */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <WarningAmberIcon sx={{ color: '#EF4444', fontSize: 20 }} />
                    <Typography variant="h6" fontWeight="700" sx={{ color: '#EF4444' }}>Danger Zone</Typography>
                  </Box>
                  <Typography variant="body2" color="text.disabled" mb={3}>
                    These actions are permanent and cannot be undone.
                  </Typography>
                  <Box sx={{ p: 3, borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)', backgroundColor: 'rgba(239,68,68,0.04)', display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Delete account — all users */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="700">Delete my account</Typography>
                        <Typography variant="caption" color="text.disabled">
                          Permanently removes your account and all associated data. This cannot be undone.
                        </Typography>
                      </Box>
                      <Button
                        variant="outlined" size="small" onClick={() => { setDeleteAccountError(''); setIsDeleteAccountDialogOpen(true); }}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', borderColor: 'rgba(239,68,68,0.4)', color: '#EF4444', whiteSpace: 'nowrap', '&:hover': { borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.08)' } }}
                      >
                        Delete account
                      </Button>
                    </Box>

                    {/* Delete organization — ADMIN only */}
                    {user?.orgRole === 'ADMIN' && (
                      <>
                        <Divider sx={{ borderColor: 'rgba(239,68,68,0.1)' }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="700">Delete organization</Typography>
                            <Typography variant="caption" color="text.disabled">
                              Permanently deletes this workspace, all projects, tasks, and removes all members. This cannot be undone.
                            </Typography>
                          </Box>
                          <Button
                            variant="outlined" size="small" onClick={() => setIsCloseOrgDialogOpen(true)}
                            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', borderColor: 'rgba(239,68,68,0.4)', color: '#EF4444', whiteSpace: 'nowrap', '&:hover': { borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.08)' } }}
                          >
                            Delete organization
                          </Button>
                        </Box>
                      </>
                    )}
                  </Box>
                </Box>

              </Box>
            )}

          </Box>
        </Box>
      </Box>

      {/* Cancel Subscription Dialog */}
      <Dialog
        open={isCancelDialogOpen}
        onClose={() => { if (!isCancelLoading) setIsCancelDialogOpen(false); }}
        slotProps={{ paper: {
          elevation: 0,
          sx: { borderRadius: '12px', width: '100%', maxWidth: 420, backgroundColor: '#18181B', border: '1px solid rgba(239,68,68,0.2)' },
        } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#FFFFFF', pt: 3, pb: 1 }}>
          Cancel subscription?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Your plan stays active until <Box component="span" sx={{ color: '#FFFFFF', fontWeight: 600 }}>{nextBillingDate ?? 'the end of the billing period'}</Box>. After that, you'll be moved to the Free Tier and lose access to Pro features.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => setIsCancelDialogOpen(false)}
            disabled={isCancelLoading}
            sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary', borderRadius: '8px' }}
          >
            Keep plan
          </Button>
          <Button
            onClick={handleCancelSubscription}
            disabled={isCancelLoading}
            variant="contained"
            disableElevation
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', backgroundColor: '#EF4444', '&:hover': { backgroundColor: '#DC2626' } }}
          >
            {isCancelLoading ? 'Canceling…' : 'Yes, cancel'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Close Organization Dialog */}
      <Dialog
        open={isCloseOrgDialogOpen}
        onClose={() => { if (!isCloseOrgLoading) { setIsCloseOrgDialogOpen(false); setCloseOrgConfirmText(''); } }}
        slotProps={{ paper: { elevation: 0, sx: { borderRadius: '12px', width: '100%', maxWidth: 460, backgroundColor: '#18181B', border: '1px solid rgba(239,68,68,0.25)' } } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#EF4444', pt: 3, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberIcon fontSize="small" /> Delete organization?
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            This will permanently delete <Box component="span" sx={{ color: '#FFFFFF', fontWeight: 600 }}>{user?.name ?? 'your organization'}</Box>, all projects, tasks, and remove all members. This action <Box component="span" sx={{ color: '#EF4444', fontWeight: 700 }}>cannot be undone</Box>.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Type <Box component="span" sx={{ color: '#FFFFFF', fontWeight: 700, fontFamily: 'monospace' }}>DELETE</Box> to confirm:
          </Typography>
          <TextField
            size="small" fullWidth value={closeOrgConfirmText}
            onChange={e => setCloseOrgConfirmText(e.target.value)}
            placeholder="DELETE" sx={inputStyle}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => { setIsCloseOrgDialogOpen(false); setCloseOrgConfirmText(''); }} disabled={isCloseOrgLoading}
            sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary', borderRadius: '8px' }}>
            Cancel
          </Button>
          <Button onClick={handleCloseOrganization} disabled={isCloseOrgLoading || closeOrgConfirmText !== 'DELETE'}
            variant="contained" disableElevation
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', backgroundColor: '#EF4444', '&:hover': { backgroundColor: '#DC2626' } }}>
            {isCloseOrgLoading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Delete organization'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog
        open={isDeleteAccountDialogOpen}
        onClose={() => { if (!isDeleteAccountLoading) { setIsDeleteAccountDialogOpen(false); setDeleteAccountError(''); } }}
        slotProps={{ paper: { elevation: 0, sx: { borderRadius: '12px', width: '100%', maxWidth: 440, backgroundColor: '#18181B', border: '1px solid rgba(239,68,68,0.25)' } } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#EF4444', pt: 3, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberIcon fontSize="small" /> Delete account?
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            This will permanently delete your account. You will be logged out immediately and <Box component="span" sx={{ color: '#EF4444', fontWeight: 700 }}>this action cannot be undone</Box>.
          </Typography>
          {deleteAccountError && (
            <Typography variant="body2" sx={{ color: '#EF4444', fontWeight: 600 }}>
              {deleteAccountError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => { setIsDeleteAccountDialogOpen(false); setDeleteAccountError(''); }}
            disabled={isDeleteAccountLoading}
            sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary', borderRadius: '8px' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAccount}
            disabled={isDeleteAccountLoading}
            variant="contained"
            disableElevation
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', backgroundColor: '#EF4444', '&:hover': { backgroundColor: '#DC2626' } }}
          >
            {isDeleteAccountLoading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Delete account'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!memberToRemove}
        onClose={() => { if (!removingMemberId) setMemberToRemove(null); }}
        slotProps={{ paper: {
          elevation: 0,
          sx: {
            borderRadius: '12px',
            width: '100%',
            maxWidth: 400,
            backgroundColor: '#18181B',
            border: '1px solid #2A2A2E',
          },
        } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#FFFFFF', pt: 3, pb: 1 }}>
          Remove Member
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to remove{' '}
            <Box component="span" sx={{ color: '#FFFFFF', fontWeight: 700 }}>
              {memberToRemove ? `${memberToRemove.user.firstName} ${memberToRemove.user.lastName ?? ''}`.trim() : ''}
            </Box>
            {' '}from this workspace? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => setMemberToRemove(null)}
            disabled={!!removingMemberId}
            sx={{ color: 'text.disabled', textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disableElevation
            onClick={confirmRemoveMember}
            disabled={!!removingMemberId}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
              py: 1,
              backgroundColor: '#ef4444',
              color: '#FFFFFF',
              '&:hover': { backgroundColor: '#dc2626' },
            }}
          >
            {removingMemberId ? 'Removing…' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!inviteToRevoke}
        onClose={() => { if (!revokingInviteId) setInviteToRevoke(null); }}
        slotProps={{ paper: {
          elevation: 0,
          sx: {
            borderRadius: '12px',
            width: '100%',
            maxWidth: 400,
            backgroundColor: '#18181B',
            border: '1px solid #2A2A2E',
          },
        } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#FFFFFF', pt: 3, pb: 1 }}>
          Revoke Invitation
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to revoke the invitation sent to{' '}
            <Box component="span" sx={{ color: '#FFFFFF', fontWeight: 700 }}>
              {inviteToRevoke?.email}
            </Box>
            ? They will no longer be able to join this workspace with this invite.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => setInviteToRevoke(null)}
            disabled={!!revokingInviteId}
            sx={{ color: 'text.disabled', textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disableElevation
            onClick={confirmRevokeInvite}
            disabled={!!revokingInviteId}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
              py: 1,
              backgroundColor: '#ef4444',
              color: '#FFFFFF',
              '&:hover': { backgroundColor: '#dc2626' },
            }}
          >
            {revokingInviteId ? 'Revoking…' : 'Revoke'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isInviteModalOpen}
        onClose={handleCloseInviteModal}
        slotProps={{ paper: {
          elevation: 0,
          sx: {
            borderRadius: '12px',
            width: '100%',
            maxWidth: 440,
            backgroundColor: '#18181B',
            border: '1px solid',
            borderColor: '#2A2A2E',
          },
        } }}
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
