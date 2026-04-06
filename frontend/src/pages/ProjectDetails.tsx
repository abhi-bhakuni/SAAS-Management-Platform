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
  Chip,
  Avatar,
  IconButton,
  Drawer,
  TextField,
  Divider,
  Dialog,
  DialogContent,
  DialogActions,
  Select,
  MenuItem as SelectItem, // rename to avoid conflict with Menu -> MenuItem
  FormControl,
  InputLabel
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { AssigneeSelect } from '../components/AssigneeSelect';
import type { UserOption } from '../components/AssigneeSelect';
import { TaskStatusSelect } from '../components/TaskStatusSelect';
import { TaskRow } from '../components/TaskRow';

import type { Task, TaskStatus, TaskPriority } from '../types/task';

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

  useEffect(() => {
    const fetchData = async () => {
      if (user?.selectedOrgId && projectId) {
        try {
          const [tasksData, usersData] = await Promise.all([
            taskApi.getTasks(user.selectedOrgId, projectId),
            taskApi.getAssignableUsers(user.selectedOrgId, projectId)
          ]);
          
          setTasks((tasksData as any).data || tasksData);
          
          // Map backend users to UserOption format
          const mappedUsers = usersData.map((u: any) => ({
            id: u.id,
            firstName: u.firstName,
            lastName: u.lastName,
            name: `${u.firstName} ${u.lastName}`,
            email: u.email,
            avatar: '' // backend hasn't provided avatar yet
          }));
          setAssignableUsers([{ id: 'unassigned', name: 'Unassigned', avatar: '' }, ...mappedUsers]);
        } catch (error) {
          console.error("Failed to fetch project details", error);
        }
      }
      setIsLoading(false);
    };
    fetchData();
  }, [user?.selectedOrgId, projectId]);

  const handleOpenAddModal = () => setIsAddModalOpen(true);
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
      // Revert on failure if needed (omitted for brevity)
    }
  };

  // Helpers for Priority
  const getPriorityColor = (priority: TaskPriority) => {
    switch(priority) {
      case 'low': return 'default';
      case 'medium': return 'info';
      case 'high': return 'warning';
      case 'urgent': return 'error';
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'background.default' }}>
      
      {/* Top Header Section */}
      <Box sx={{ 
        borderBottom: '1px solid', 
        borderColor: 'divider', 
        backgroundColor: 'background.paper',
        px: { xs: 2, md: 4 },
        py: 3
      }}>
        <Button 
          startIcon={<ArrowBackIcon fontSize="small" />} 
          onClick={() => navigate('/')}
          sx={{ mb: 2, color: 'text.secondary', textTransform: 'none', px: 0, minWidth: 0, '&:hover': { backgroundColor: 'transparent', color: 'text.primary' } }}
        >
          Back to Projects
        </Button>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" fontWeight="700" color="text.primary" gutterBottom>
              {projectId === 'proj-1' ? 'Website Redesign' : 'Project Alpha'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Managing tasks and progress for the current timeline.
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            disableElevation
            startIcon={<AddIcon />}
            onClick={handleOpenAddModal}
            sx={{ 
              borderRadius: '8px', 
              textTransform: 'none', 
              fontWeight: 500,
              backgroundColor: 'text.primary',
              color: 'background.paper',
              '&:hover': { backgroundColor: 'grey.800' }
            }}
          >
            Add Task
          </Button>
        </Box>

        {/* Filter Bar */}
        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          <Button startIcon={<FilterListIcon />} size="small" sx={{ textTransform: 'none', color: 'text.secondary', borderRadius: '6px', border: '1px solid', borderColor: 'divider' }}>
            Filter
          </Button>
          <Button size="small" sx={{ textTransform: 'none', color: 'text.secondary', borderRadius: '6px' }}>Status</Button>
          <Button size="small" sx={{ textTransform: 'none', color: 'text.secondary', borderRadius: '6px' }}>Assignee</Button>
          <Button size="small" sx={{ textTransform: 'none', color: 'text.secondary', borderRadius: '6px' }}>Priority</Button>
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, md: 4 } }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          
          {isLoading ? (
            <Box sx={{ textAlign: 'center', py: 10, backgroundColor: 'background.paper', borderRadius: '12px', border: '1px dashed', borderColor: 'divider' }}>
              <Typography variant="body1" color="text.secondary">Loading tasks...</Typography>
            </Box>
          ) : tasks.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 10, backgroundColor: 'background.paper', borderRadius: '12px', border: '1px dashed', borderColor: 'divider' }}>
              <ReceiptLongOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" fontWeight="600" color="text.primary" gutterBottom>
                No tasks yet
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Create your first task to get started.
              </Typography>
              <Button onClick={handleOpenAddModal} variant="outlined" startIcon={<AddIcon />} sx={{ borderRadius: '8px', textTransform: 'none' }}>
                Create Task
              </Button>
            </Box>
          ) : (
            <TableContainer sx={{ 
              backgroundColor: 'background.paper', 
              borderRadius: '12px', 
              border: '1px solid', 
              borderColor: 'divider',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
            }}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ backgroundColor: 'background.default' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.8rem', borderBottom: '1px solid', borderColor: 'divider' }}>Task</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.8rem', borderBottom: '1px solid', borderColor: 'divider' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.8rem', borderBottom: '1px solid', borderColor: 'divider' }}>Assignee</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.8rem', borderBottom: '1px solid', borderColor: 'divider' }}>Priority</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.8rem', borderBottom: '1px solid', borderColor: 'divider' }}>Due Date</TableCell>
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
          )}
        </Box>
      </Box>

      {/* Task Edit Side Panel */}
      <Drawer
        anchor="right"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 400 }, p: 3, borderLeft: '1px solid', borderColor: 'divider' } }}
        elevation={0}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary">{selectedTask?.id}</Typography>
          <IconButton onClick={() => setIsDrawerOpen(false)} size="small"><CloseIcon /></IconButton>
        </Box>
        
        <Typography variant="h5" fontWeight="700" color="text.primary" mb={4}>
          {selectedTask?.title}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ width: 100 }}>Status</Typography>
            {selectedTask && (
              <TaskStatusSelect 
                value={selectedTask.status}
                onChange={(newStatus) => updateTaskStatus(selectedTask.id, newStatus)}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ width: 100 }}>Assignee</Typography>
            {selectedTask && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem' }}>
                  {selectedTask.assignedToUser?.firstName?.[0] || 'U'}
                </Avatar>
                <Typography variant="body2">{selectedTask.assignedToUser?.firstName || 'Unassigned'}</Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ width: 100 }}>Priority</Typography>
            {selectedTask && (
              <Chip label={selectedTask.priority.toUpperCase()} size="small" color={getPriorityColor(selectedTask.priority)} sx={{ borderRadius: '6px', fontWeight: 600, height: 24, fontSize: '0.7rem' }} />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ width: 100 }}>Due Date</Typography>
            <Typography variant="body2">
              {selectedTask?.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : 'No date'}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 4 }} />
        
        <Typography variant="subtitle2" fontWeight="600" mb={1}>Description</Typography>
        <TextField
          multiline
          fullWidth
          rows={4}
          variant="outlined"
          placeholder="Add a more detailed description..."
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.9rem' } }}
        />
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
            maxWidth: 600,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)'
          }
        }}
      >
        <DialogContent sx={{ p: 4 }}>
          <TextField
            autoFocus
            placeholder="Task Title"
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
              sx: { fontSize: '1.5rem', fontWeight: 700, color: 'text.primary', mb: 2 }
            }}
          />
          
          <TextField
            placeholder="Add a description..."
            variant="standard"
            fullWidth
            multiline
            rows={3}
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            InputProps={{
              disableUnderline: true,
              sx: { fontSize: '0.95rem', color: 'text.secondary', mb: 4, lineHeight: 1.6 }
            }}
          />

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {/* Status Field */}
            <Box sx={{ display: 'flex', flexDirection: 'column', mr: 2, mt: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>Status</Typography>
              <TaskStatusSelect 
                value={newTask.status as TaskStatus}
                onChange={(s) => setNewTask({ ...newTask, status: s })}
              />
            </Box>

            {/* Priority Field */}
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel sx={{ fontSize: '0.8rem' }}>Priority</InputLabel>
              <Select
                value={newTask.priority}
                label="Priority"
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                sx={{ borderRadius: '8px', fontSize: '0.85rem', fontWeight: 500 }}
              >
                <SelectItem value="low"><Chip size="small" label="Low" color="default" sx={{ borderRadius: '4px', height: 20 }} /></SelectItem>
                <SelectItem value="medium"><Chip size="small" label="Medium" color="info" sx={{ borderRadius: '4px', height: 20 }} /></SelectItem>
                <SelectItem value="high"><Chip size="small" label="High" color="warning" sx={{ borderRadius: '4px', height: 20 }} /></SelectItem>
              </Select>
            </FormControl>

            {/* Due Date Field */}
            <TextField
              label="Due Date"
              type="date"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={newTask.dueDate}
              onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.85rem', height: 40 } }}
            />
            
            {/* Assignee Select Component */}
            <AssigneeSelect 
              value={selectedAssignee} 
              onChange={(u) => setSelectedAssignee(u)}
              options={assignableUsers}
            />
          </Box>

        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 3, pt: 1, justifyContent: 'space-between', borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={handleCloseAddModal} sx={{ color: 'text.secondary', textTransform: 'none', fontWeight: 500, borderRadius: '6px' }}>
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
              fontWeight: 500,
              backgroundColor: 'text.primary',
              color: 'background.paper',
              '&:hover': { backgroundColor: 'grey.800' }
            }}
          >
            Save Task
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
