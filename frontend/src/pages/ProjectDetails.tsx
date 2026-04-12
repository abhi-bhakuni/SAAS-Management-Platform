import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { taskApi } from '../services/api';
import { 
  Box, 
  Typography, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  IconButton,
  Drawer,
  TextField,
  Divider,
  Dialog,
  DialogContent,
  DialogActions,
  Select,
  MenuItem as SelectItem,
  FormControl,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { AssigneeSelect } from '../components/AssigneeSelect';
import type { UserOption } from '../components/AssigneeSelect';
import { TaskStatusSelect } from '../components/TaskStatusSelect';
import { TaskRow } from '../components/TaskRow';
import { Sidebar } from '../components/Sidebar';

import type { Task, TaskStatus, TaskPriority } from '../types/task';
import { KanbanBoard } from '../components/KanbanBoard';
import { ActivityFeed } from '../components/ActivityFeed';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import HistoryIcon from '@mui/icons-material/History';

// Removed TaskLocal and mockTasks as we move to real backend data

export function ProjectDetails() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignableUsers, setAssignableUsers] = useState<UserOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // States for interactions
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Add Task Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    dueDate: ''
  });
  const [selectedAssignee, setSelectedAssignee] = useState<UserOption>({ id: 'unassigned', name: 'Unassigned', avatar: '' });
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [isActivityOpen, setIsActivityOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksData, usersData] = await Promise.all([
          taskApi.getTasks(user?.selectedOrgId, projectId),
          taskApi.getAssignableUsers(user?.selectedOrgId || 'guest', projectId || 'sandbox')
        ]);
        
        setTasks((tasksData as any).data || tasksData);
        
        const mappedUsers = Array.isArray(usersData) ? usersData.map((u: any) => ({
          id: u.id,
          firstName: u.firstName || u.name?.split(' ')[0],
          lastName: u.lastName || u.name?.split(' ')[1] || '',
          name: u.name || `${u.firstName} ${u.lastName}`,
          email: u.email || '',
          avatar: u.avatar || ''
        })) : [];
        setAssignableUsers([{ id: 'unassigned', name: 'Unassigned', avatar: '' }, ...mappedUsers]);
      } catch (error) {
        console.error("Failed to fetch project details", error);
      }
      setIsLoading(false);
    };
    fetchData();
  }, [user?.selectedOrgId, user, projectId]);

  const handleOpenAddModal = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setIsAddModalOpen(true);
  };
  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setNewTask({ title: '', description: '', status: 'todo', priority: 'medium', dueDate: '' });
    setSelectedAssignee({ id: 'unassigned', name: 'Unassigned', avatar: '' });
  };

  const handleCreateTask = async () => {
    if (!newTask.title || !user?.selectedOrgId || !projectId) return;
    try {
      const created = await taskApi.createTask(user.selectedOrgId, projectId, {
        title: newTask.title,
        description: newTask.description,
        status: newTask.status || 'todo',
        priority: newTask.priority || 'medium',
        dueDate: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : undefined,
        assignedToUserId: selectedAssignee.id === 'unassigned' ? undefined : selectedAssignee.id
      } as any);
      
      setTasks([created, ...tasks]);
      handleCloseAddModal();
    } catch (error) {
      console.error("Failed to create task", error);
    }
  };
  
  const handleRowClick = (task: Task) => {
    setSelectedTask(task);
    setIsDrawerOpen(true);
  };

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!user?.selectedOrgId || !projectId) return;
    try {
      // Optimistic update
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      if (selectedTask?.id === taskId) {
        setSelectedTask({ ...selectedTask, status: newStatus });
      }
      
      await taskApi.updateTaskStatus(user.selectedOrgId, projectId, taskId, newStatus);
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const handleTasksOrderChange = (newTasks: Task[]) => {
    setTasks(newTasks);
    // TODO: Persistence for order if needed
  };



  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'background.default' }}>
      <Sidebar />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      
      {/* Top Header Section */}
      <Box sx={{ 
        borderBottom: '1px solid', 
        borderColor: 'rgba(255, 255, 255, 0.05)', 
        backgroundColor: '#0F0F11',
        px: { xs: 2, md: 4 },
        py: 2.5
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="body2" sx={{ color: 'text.disabled', fontWeight: 500, cursor: 'pointer', '&:hover': { color: 'text.secondary' } }} onClick={() => navigate('/')}>
              Workspaces
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.2)' }}>/</Typography>
            <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
              Project Details
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Box sx={{ 
              display: 'flex', 
              backgroundColor: 'rgba(255, 255, 255, 0.03)', 
              borderRadius: '8px', 
              p: 0.5,
              border: '1px solid',
              borderColor: 'rgba(255, 255, 255, 0.05)',
              mr: 1
            }}>
              <IconButton 
                size="small" 
                onClick={() => setViewMode('list')}
                sx={{ 
                  borderRadius: '6px',
                  color: viewMode === 'list' ? '#FFFFFF' : 'text.disabled',
                  backgroundColor: viewMode === 'list' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.08)' }
                }}
              >
                <ViewListIcon sx={{ fontSize: 18 }} />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={() => setViewMode('board')}
                sx={{ 
                  borderRadius: '6px',
                  color: viewMode === 'board' ? '#FFFFFF' : 'text.disabled',
                  backgroundColor: viewMode === 'board' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.08)' }
                }}
              >
                <ViewWeekIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
            <IconButton 
              onClick={() => setIsActivityOpen(true)}
              sx={{ 
                borderRadius: '8px', 
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid',
                borderColor: 'rgba(255, 255, 255, 0.05)',
                color: 'text.secondary',
                mr: 1,
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#FFFFFF' }
              }}
            >
              <HistoryIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <Button 
              variant="contained" 
              disableElevation
              startIcon={<AddIcon />}
              onClick={handleOpenAddModal}
              sx={{ 
                borderRadius: '6px', 
                textTransform: 'none', 
                fontWeight: 600,
                fontSize: '0.85rem',
                backgroundColor: '#FFFFFF',
                color: '#000000',
                px: 2,
                '&:hover': { backgroundColor: '#E2E2E2' }
              }}
            >
              Add Task
            </Button>
          </Box>
        </Box>

        {/* Filter Bar */}
        <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
          <Button 
            startIcon={<FilterListIcon sx={{ fontSize: 16 }} />} 
            size="small" 
            sx={{ 
              textTransform: 'none', 
              color: 'text.secondary', 
              borderRadius: '6px', 
              border: '1px solid', 
              borderColor: 'rgba(255, 255, 255, 0.1)',
              px: 1.5,
              fontSize: '0.8rem',
              '&:hover': { borderColor: 'rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.03)' }
            }}
          >
            Filters
          </Button>
          <Box sx={{ display: 'flex', gap: 1, ml: 1 }}>
            {['Status', 'Assignee', 'Priority'].map((label) => (
              <Button 
                key={label}
                size="small" 
                sx={{ 
                  textTransform: 'none', 
                  color: 'text.disabled', 
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  px: 1,
                  '&:hover': { color: 'text.secondary', backgroundColor: 'rgba(255, 255, 255, 0.03)' }
                }}
              >
                {label}
              </Button>
            ))}
          </Box>
        </Box>
      </Box>

        {/* Main Content Area */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, md: 4 } }}>
          <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
            
            {/* Project Title and Description */}
            <Box sx={{ mb: 5 }}>
              <Typography variant="h4" fontWeight="800" sx={{ letterSpacing: '-0.02em', mb: 1 }}>
                Project Workspace
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 700, lineHeight: 1.6 }}>
                Collaborate with your team to deliver high-impact results through this dedicated workspace.
              </Typography>
            </Box>

            {isLoading ? (
              <Box sx={{ textAlign: 'center', py: 10, backgroundColor: 'rgba(255, 255, 255, 0.01)', borderRadius: '16px', border: '1px dashed', borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                <Typography variant="body1" color="text.secondary">Loading your workspace...</Typography>
              </Box>
            ) : tasks.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 12, backgroundColor: 'rgba(255, 255, 255, 0.01)', borderRadius: '16px', border: '1px dashed', borderColor: 'rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box sx={{ p: 2, borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', mb: 3 }}>
                  <ReceiptLongOutlinedIcon sx={{ fontSize: 32, color: 'text.disabled' }} />
                </Box>
                <Typography variant="h6" fontWeight="700" color="text.primary" gutterBottom>
                  The list is empty
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: 320, lineHeight: 1.6 }}>
                  You haven't added any tasks yet. Launch your first task to start tracking progress.
                </Typography>
                <Button onClick={handleOpenAddModal} variant="outlined" startIcon={<AddIcon />} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, borderColor: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF', px: 3 }}>
                  Create Task
                </Button>
              </Box>
            ) : viewMode === 'list' ? (
              <TableContainer sx={{ 
                backgroundColor: '#0F0F11', 
                borderRadius: '16px', 
                border: '1px solid', 
                borderColor: 'rgba(255, 255, 255, 0.05)',
                overflow: 'hidden'
              }}>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: 'text.disabled', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid', borderColor: 'rgba(255, 255, 255, 0.05)', py: 1.5, px: 3 }}>Task Name</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.disabled', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid', borderColor: 'rgba(255, 255, 255, 0.05)', py: 1.5, px: 3 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.disabled', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid', borderColor: 'rgba(255, 255, 255, 0.05)', py: 1.5, px: 3 }}>Assignee</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.disabled', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid', borderColor: 'rgba(255, 255, 255, 0.05)', py: 1.5, px: 3 }}>Priority</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.disabled', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid', borderColor: 'rgba(255, 255, 255, 0.05)', py: 1.5, px: 3 }}>Due date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tasks.map((task) => (
                      <TaskRow 
                        key={task.id}
                        task={task}
                        isSelected={selectedTask?.id === task.id}
                        onClick={() => handleRowClick(task)}
                        onStatusChange={(newStatus) => updateTaskStatus(task.id, newStatus)}
                      />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <KanbanBoard 
                tasks={tasks}
                onTaskMove={updateTaskStatus}
                onTasksOrderChange={handleTasksOrderChange}
              />
            )}
          </Box>
        </Box>

        {/* Task Edit Side Panel */}
        <Drawer
          anchor="right"
          open={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          PaperProps={{ 
            sx: { 
              width: { xs: '100%', sm: 460 }, 
              p: 0, 
              backgroundColor: '#18181B', 
              borderLeft: '1px solid', 
              borderColor: 'rgba(255, 255, 255, 0.05)',
              boxShadow: '-10px 0 40px rgba(0,0,0,0.6)'
            } 
          }}
          elevation={0}
        >
          {/* Header */}
          <Box sx={{ 
            p: 3, 
            pb: 2, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <ReceiptLongOutlinedIcon sx={{ color: 'text.disabled', fontSize: 18 }} />
              <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                TASK DETAILS {selectedTask?.id && `• ${selectedTask.id.slice(0, 8)}`}
              </Typography>
            </Box>
            <IconButton onClick={() => setIsDrawerOpen(false)} size="small" sx={{ color: 'text.disabled', '&:hover': { color: '#FFFFFF' } }}>
              <CloseIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
          
          <Box sx={{ p: 4, overflowY: 'auto', flexGrow: 1 }}>
            {/* Title - Edit Mode */}
            <Typography variant="h5" fontWeight="800" color="text.primary" mb={4} sx={{ letterSpacing: '-0.01em' }}>
              {selectedTask?.title}
            </Typography>

            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 3.5,
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              p: 3,
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              {/* Properties Grid inside Drawer */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" color="text.disabled" sx={{ width: 120, fontWeight: 600 }}>Status</Typography>
                {selectedTask && (
                  <TaskStatusSelect 
                    value={selectedTask.status}
                    onChange={(newStatus) => updateTaskStatus(selectedTask.id, newStatus)}
                  />
                )}
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" color="text.disabled" sx={{ width: 120, fontWeight: 600 }}>Assignee</Typography>
                {selectedTask && (
                  <AssigneeSelect 
                    value={{
                      id: selectedTask.assignedToUserId || 'unassigned',
                      name: selectedTask.assignedToUser ? `${selectedTask.assignedToUser.firstName} ${selectedTask.assignedToUser.lastName}` : 'Unassigned',
                      avatar: ''
                    }}
                    options={assignableUsers}
                    onChange={(_u) => {
                      // Logic would go here to update the task in the backend
                    }}
                  />
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" color="text.disabled" sx={{ width: 120, fontWeight: 600 }}>Priority</Typography>
                {selectedTask && (
                  <FormControl size="small" sx={{ width: 120 }}>
                    <Select
                      value={selectedTask.priority}
                      sx={{ 
                        borderRadius: '6px', 
                        fontSize: '0.8rem', 
                        fontWeight: 600,
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.1)' }
                      }}
                    >
                      <SelectItem value="low"><Typography variant="body2">Low</Typography></SelectItem>
                      <SelectItem value="medium"><Typography variant="body2">Medium</Typography></SelectItem>
                      <SelectItem value="high"><Typography variant="body2">High</Typography></SelectItem>
                      <SelectItem value="urgent"><Typography variant="body2">Urgent</Typography></SelectItem>
                    </Select>
                  </FormControl>
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" color="text.disabled" sx={{ width: 120, fontWeight: 600 }}>Due Date</Typography>
                <TextField
                  type="date"
                  size="small"
                  sx={{ 
                    width: 160,
                    '& .MuiOutlinedInput-root': { 
                      borderRadius: '6px', 
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' }
                    } 
                  }}
                  value={selectedTask?.dueDate ? new Date(selectedTask.dueDate).toISOString().split('T')[0] : ''}
                />
              </Box>
            </Box>

            <Divider sx={{ my: 4, opacity: 0.05 }} />
            
            <Typography variant="subtitle2" fontWeight="700" color="text.primary" mb={1.5}>Description</Typography>
            <TextField
              multiline
              fullWidth
              rows={6}
              variant="outlined"
              placeholder="Add details about this task..."
              defaultValue={selectedTask?.description}
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  borderRadius: '10px', 
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  backgroundColor: 'rgba(255, 255, 255, 0.01)',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.05)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                  '&.Mui-focused fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' }
                } 
              }}
            />
          </Box>
          
          {/* Action Footer */}
          <Box sx={{ 
            p: 3, 
            borderTop: '1px solid rgba(255, 255, 255, 0.05)', 
            display: 'flex', 
            justifyContent: 'flex-end',
            gap: 2
          }}>
            <Button size="small" sx={{ textTransform: 'none', color: 'text.disabled' }}>Delete Task</Button>
            <Button size="small" variant="contained" disableElevation sx={{ borderRadius: '6px', textTransform: 'none', px: 3, backgroundColor: '#FFFFFF', color: '#000000', fontWeight: 700 }}>Save Changes</Button>
          </Box>
        </Drawer>

      {/* Add Task Modal */}
      <Dialog 
        open={isAddModalOpen} 
        onClose={handleCloseAddModal}
        PaperProps={{
          elevation: 0,
          sx: {
            borderRadius: '12px',
            width: '100%',
            maxWidth: 500,
            backgroundColor: '#18181B',
            border: '1px solid',
            borderColor: '#2A2A2E',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }
        }}
      >
        <DialogContent sx={{ p: 4 }}>
          {/* Title Field - High Prominence */}
          <TextField
            autoFocus
            placeholder="What needs to be done?"
            variant="standard"
            fullWidth
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newTask.title) {
                e.preventDefault();
                handleCreateTask();
              }
            }}
            InputProps={{
              disableUnderline: true,
              sx: { 
                fontSize: '1.4rem', 
                fontWeight: 600, 
                color: '#FFFFFF', 
                mb: 1.5,
                '& input::placeholder': { color: 'rgba(255, 255, 255, 0.3)', opacity: 1 }
              }
            }}
          />
          
          {/* Description Field */}
          <TextField
            placeholder="Add a description..."
            variant="outlined"
            fullWidth
            multiline
            rows={4}
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            sx={{ 
              mb: 4,
              '& .MuiOutlinedInput-root': { 
                borderRadius: '8px', 
                fontSize: '0.9rem', 
                color: 'text.secondary',
                backgroundColor: '#27272A',
                '& fieldset': { borderColor: 'transparent' },
                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                '&.Mui-focused fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' }
              } 
            }}
          />

          {/* Properties Grid */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: 3,
            backgroundColor: '#27272A',
            p: 3,
            borderRadius: '10px',
            border: '1px solid',
            borderColor: 'rgba(255, 255, 255, 0.05)'
          }}>
            {/* Status Field */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="caption" color="text.disabled" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Status
              </Typography>
              <TaskStatusSelect 
                value={newTask.status as TaskStatus}
                onChange={(s) => setNewTask({ ...newTask, status: s })}
              />
            </Box>

            {/* Priority Field */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="caption" color="text.disabled" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Priority
              </Typography>
              <FormControl size="small" fullWidth>
                <Select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                  sx={{ 
                    borderRadius: '6px', 
                    fontSize: '0.85rem', 
                    fontWeight: 500,
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.1)' }
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: { backgroundColor: '#18181B', border: '1px solid #2A2A2E', borderRadius: '8px' }
                    }
                  }}
                >
                  <SelectItem value="low"><Typography variant="body2">Low</Typography></SelectItem>
                  <SelectItem value="medium"><Typography variant="body2">Medium</Typography></SelectItem>
                  <SelectItem value="high"><Typography variant="body2">High</Typography></SelectItem>
                  <SelectItem value="urgent"><Typography variant="body2">Urgent</Typography></SelectItem>
                </Select>
              </FormControl>
            </Box>

            {/* Assignee Field */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="caption" color="text.disabled" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Assignee
              </Typography>
              <AssigneeSelect 
                value={selectedAssignee} 
                onChange={(u) => setSelectedAssignee(u)}
                options={assignableUsers}
              />
            </Box>

            {/* Due Date Field */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="caption" color="text.disabled" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Due Date
              </Typography>
              <TextField
                type="date"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={newTask.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: '6px', 
                    fontSize: '0.85rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' }
                  } 
                }}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 4, pb: 4, pt: 0, justifyContent: 'flex-end', gap: 2 }}>
          <Button 
            onClick={handleCloseAddModal} 
            sx={{ 
              color: 'text.secondary', 
              textTransform: 'none', 
              fontWeight: 600, 
              borderRadius: '6px',
              fontSize: '0.85rem',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#FFFFFF' }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateTask} 
            variant="contained"
            disableElevation
            disabled={!newTask.title}
            sx={{ 
              borderRadius: '6px', 
              textTransform: 'none', 
              fontWeight: 700,
              fontSize: '0.85rem',
              px: 4,
              py: 0.8,
              backgroundColor: '#FFFFFF',
              color: '#000000',
              '&:hover': { backgroundColor: '#E2E2E2' },
              '&.Mui-disabled': { backgroundColor: '#2A2A2E', color: '#52525B' }
            }}
          >
            Create Task
          </Button>
        </DialogActions>
      </Dialog>

      {/* Activity Feed Sidebar */}
      <Drawer
        anchor="right"
        open={isActivityOpen}
        onClose={() => setIsActivityOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 360 },
            backgroundColor: '#18181B',
            borderLeft: '1px solid',
            borderColor: 'rgba(255, 255, 255, 0.05)',
            boxShadow: '-10px 0 30px rgba(0,0,0,0.5)'
          }
        }}
      >
        <ActivityFeed 
          orgId={user?.selectedOrgId || 'demo-org'} 
          projectId={projectId || 'demo-project'} 
        />
      </Drawer>
    </Box>
    </Box>
  );
}
