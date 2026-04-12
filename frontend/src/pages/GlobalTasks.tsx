import { useState, useMemo, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Avatar,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  CircularProgress
} from '@mui/material';
import { Sidebar } from '../components/Sidebar';
import { taskApi, projectsApi } from '../services/api';
import { TaskStatusSelect } from '../components/TaskStatusSelect';
import type { TaskStatus } from '../types/task';
import FilterListIcon from '@mui/icons-material/FilterList';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import { useNavigate } from 'react-router-dom';

export function GlobalTasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, projectsRes] = await Promise.all([
          taskApi.getTasks(),
          projectsApi.getProjects()
        ]);
        setTasks(tasksRes);
        setProjects(Array.isArray(projectsRes) ? projectsRes : (projectsRes.data || []));
      } catch (error) {
        console.error('Failed to fetch tasks or projects:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Enrich tasks with project names
  const enrichedTasks = useMemo(() => {
    return tasks.map(task => {
      const project = projects.find(p => p.id === task.projectId);
      return {
        ...task,
        projectName: project ? project.title || project.name : 'Sandbox Project'
      };
    });
  }, [tasks, projects]);

  // Filter logic
  const filteredTasks = useMemo(() => {
    return enrichedTasks.filter(task => {
      const matchStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchProject = projectFilter === 'all' || task.projectId === projectFilter;
      const matchAssignee = assigneeFilter === 'all' || 
                           task.assignedToUser?.firstName === assigneeFilter || 
                           task.assignee === assigneeFilter;
      return matchStatus && matchProject && matchAssignee;
    });
  }, [enrichedTasks, statusFilter, projectFilter, assigneeFilter]);

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#0F0F11' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header Section */}
        <Box sx={{ 
          p: { xs: 3, md: 5 }, 
          pb: 3,
          borderBottom: '1px solid',
          borderColor: 'rgba(255, 255, 255, 0.05)',
          backgroundColor: '#0F0F11'
        }}>
          <Typography variant="h4" fontWeight="800" sx={{ letterSpacing: '-0.02em', mb: 1 }}>
            All Tasks
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={4}>
            Cross-project visibility for every item in your workspace.
          </Typography>

          {/* Filter Bar */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                displayEmpty
                sx={filterStyle}
              >
                <MenuItem value="all">All Projects</MenuItem>
                {projects.map(p => (
                  <MenuItem key={p.id} value={p.id}>{p.title || p.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={filterStyle}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="Todo">Todo</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Review">Review</MenuItem>
                <MenuItem value="Done">Done</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                sx={filterStyle}
              >
                <MenuItem value="all">Every Assignee</MenuItem>
                <MenuItem value="Abhishek B.">Abhishek B.</MenuItem>
                <MenuItem value="Sarah M.">Sarah M.</MenuItem>
                <MenuItem value="David C.">David C.</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ flexGrow: 1 }} />
            
            <IconButton sx={{ color: 'text.disabled', '&:hover': { color: '#FFFFFF', backgroundColor: 'rgba(255, 255, 255, 0.05)' } }}>
              <FilterListIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Table Content Area */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: { xs: 3, md: 5 } }}>
          <TableContainer sx={{ 
            backgroundColor: '#0F0F11', 
            borderRadius: '16px', 
            border: '1px solid', 
            borderColor: 'rgba(255, 255, 255, 0.05)',
            overflow: 'hidden'
          }}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={headerCellStyle}>Task Name</TableCell>
                  <TableCell sx={headerCellStyle}>Project</TableCell>
                  <TableCell sx={headerCellStyle}>Status</TableCell>
                  <TableCell sx={headerCellStyle}>Assignee</TableCell>
                  <TableCell sx={headerCellStyle}>Due Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ py: 10, textAlign: 'center', borderBottom: 0 }}>
                      <CircularProgress size={24} sx={{ color: 'text.disabled', mb: 2 }} />
                      <Typography color="text.secondary">Loading your workspace...</Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ py: 10, textAlign: 'center', borderBottom: 0 }}>
                      <ReceiptLongOutlinedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 2 }} />
                      <Typography color="text.secondary">No tasks match your filters</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTasks.map((task) => (
                    <TableRow 
                      key={task.id} 
                      hover
                      onClick={() => navigate(`/projects/${task.id}`)}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.02) !important' }
                      }}
                    >
                      <TableCell sx={cellStyle}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Typography variant="body2" fontWeight="700" color="#FFFFFF">
                            <Box component="span" sx={{ color: 'text.disabled', fontWeight: 500, mr: 1, fontSize: '0.75rem' }}>
                              {task.id}
                            </Box>
                            {task.title}
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell sx={cellStyle}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LayersOutlinedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                          <Typography variant="body2" color="text.secondary" fontWeight="600" sx={{ fontSize: '0.8rem' }}>
                            {task.projectName}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell sx={cellStyle}>
                        <Box onClick={(e) => e.stopPropagation()}>
                          <TaskStatusSelect 
                            value={(task.status || 'Todo') as TaskStatus}
                            onChange={() => {}} // Read-only for Global View currently
                          />
                        </Box>
                      </TableCell>

                      <TableCell sx={cellStyle}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', fontWeight: 700, backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            {task.assignee?.[0] || task.assignedToUser?.firstName?.[0] || 'U'}
                          </Avatar>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                            {task.assignee || task.assignedToUser?.firstName || 'Unassigned'}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell sx={cellStyle}>
                        <Typography variant="body2" color="text.disabled" sx={{ fontSize: '0.8rem' }}>
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '-'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </Box>
  );
}

const filterStyle = { 
  borderRadius: '8px', 
  fontSize: '0.85rem', 
  backgroundColor: 'rgba(255, 255, 255, 0.03)',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.1)' }
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
  py: 2, 
  px: 3, 
  borderBottom: '1px solid', 
  borderColor: 'rgba(255, 255, 255, 0.02)' 
};
