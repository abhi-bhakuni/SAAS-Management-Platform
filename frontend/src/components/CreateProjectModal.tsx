import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
} from '@mui/material';
import { projectsApi } from '../services/api';
import { useToast } from '../context/ToastContext';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export function CreateProjectModal({ open, onClose, onCreated }: Props) {
  const { showToast } = useToast();
  const [project, setProject] = useState({ name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setProject({ name: '', description: '' });
    onClose();
  };

  const handleCreate = async () => {
    if (!project.name) return;
    setIsSubmitting(true);
    try {
      await projectsApi.createProject(project);
      setProject({ name: '', description: '' });
      onClose();
      onCreated?.();
      showToast('Project created successfully.', 'success');
    } catch {
      showToast('Project creation failed. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
      backgroundColor: '#0F0F11',
      '& fieldset': { borderColor: '#2A2A2E' },
      '&:hover fieldset': { borderColor: '#3F3F46' },
    },
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: '12px',
          width: '100%',
          maxWidth: 400,
          backgroundColor: '#18181B',
          border: '1px solid #2A2A2E',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.25rem', pb: 1, pt: 3, color: '#FFFFFF' }}>
        Create New Project
      </DialogTitle>
      <DialogContent sx={{ pb: 3 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          Give your project a name and a brief description to get started.
        </Typography>
        <TextField
          autoFocus
          margin="dense"
          label="Project Name"
          placeholder="e.g. Website Redesign"
          fullWidth
          variant="outlined"
          size="small"
          value={project.name}
          onChange={(e) => setProject({ ...project, name: e.target.value })}
          sx={{ mb: 3, mt: 1, ...fieldSx }}
        />
        <TextField
          margin="dense"
          label="Description"
          placeholder="What is this project about?"
          fullWidth
          variant="outlined"
          multiline
          rows={3}
          size="small"
          value={project.description}
          onChange={(e) => setProject({ ...project, description: e.target.value })}
          sx={fieldSx}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 4, pt: 0, gap: 1.5 }}>
        <Button
          onClick={handleClose}
          sx={{
            color: 'text.secondary',
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '6px',
            px: 2,
            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#FFFFFF' },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          disableElevation
          disabled={!project.name || isSubmitting}
          sx={{
            borderRadius: '6px',
            textTransform: 'none',
            fontWeight: 700,
            px: 3,
            py: 0.8,
            backgroundColor: '#FFFFFF',
            color: '#000000',
            '&:hover': { backgroundColor: '#E2E2E2' },
            '&.Mui-disabled': { backgroundColor: '#2A2A2E', color: '#71717A' },
          }}
        >
          {isSubmitting ? 'Creating…' : 'Create Project'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
