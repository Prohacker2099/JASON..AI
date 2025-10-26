import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, List, ListItem, ListItemText, IconButton,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  Snackbar, Alert, Paper, FormControl, InputLabel, Select, MenuItem, Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';


interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  createdAt?: Date;
  deviceId?: string;
  status?: 'shared' | 'active';
  expiresAt?: Date;
}

interface Invitation {
  id: string;
  email?: string;
  status: 'pending' | 'accepted' | 'rejected';
  invitedBy?: string;
  userId?: string;
  deviceId?: string;
  expiresAt?: Date;
  createdAt?: Date;
  message?: string;
  senderId?: string;
  receiverId?: string;
}

interface SharedUser {
  id: string;
  name: string;
  email: string;
  accessLevel: 'full' | 'limited' | 'view-only';
  devices?: string[];
  avatarUrl?: string | null;
  permissions?: string[];
}

interface ShareOptions {
  recipient: string;
}

interface ShareItem {
  id: string;
  type: 'device' | 'automation' | 'scene' | 'data' | 'other';
  name: string;
  description?: string;
  imageUrl?: string;
}

type ShareType = 'device' | 'automation' | 'scene' | 'data' | 'other' | 'success' | 'error' | 'info' | null;

interface FetchSharingSettingsResponse {
  sharedUsers: SharedUser[];
  invitations: Invitation[];
}


const sharingApiService = {
  fetchSharingSettings: async (): Promise<FetchSharingSettingsResponse> => {
    return {
      sharedUsers: [
        { id: 'user1', name: 'Alice', email: 'alice@example.com', accessLevel: 'full', devices: ['ambientLight'] },
      ],
      invitations: [],
    };
  },
  sendInvitation: async (email: string) => ({ success: true, message: 'Invitation sent' }),
  cancelInvitation: async (inviteId: string) => ({ success: true }),
  updateSharedUser: async (userId: string, updates: any) => ({ success: true }),
  removeUser: async (userId: string) => ({ success: true }),
};








class ShareDialog {
  constructor(props: { shareItems: ShareItem[]; onShare: (item: ShareItem) => void }) {}
  open() { console.log('ShareDialog opened'); }
}

interface AdvancedSharingSystemProps {}

const AdvancedSharingSystem: React.FC<AdvancedSharingSystemProps> = () => {
  
        imageUrl: '', 
      });
    }
    return items;
  };

  const handleShare = (item: ShareItem) => {
    console.log(`Sharing ${item.type} ${item.name}`);
    setSnackbarMessage(`Shared ${item.name} successfully!`);
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 800, margin: 'auto' }}>
      <Typography variant="h4" gutterBottom component="h1">Advanced Sharing System</Typography>

      {/* Invite New User Section */}
      <Box sx={{ mt: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>Invite New User</Typography>
        <TextField
          label="Email Address"
          type="email"
          fullWidth
          value={inviteEmail}
          onChange={handleInviteChange}
          margin="normal"
          helperText="Enter the email address of the user you want to invite."
          InputProps={{
            endAdornment: (
              <IconButton onClick={handleSendInvitation} edge="end" color="primary">
                <PersonAddIcon />
              </IconButton>
            ),
          }}
        />
      </Box>

      {/* Shared Users List */}
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom>Shared Users</Typography>
        <List>
          {sharedUsers.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No shared users.</Typography>
          ) : (
            sharedUsers.map((user) => (
              <ListItem
                key={user.id}
                secondaryAction={
                  <Box>
                    <IconButton edge="end" aria-label="edit" onClick={() => handleEditUserAccess(user)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveUser(user.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={`${user.name} (${user.email})`}
                  secondary={
                    <Box>
                      <Typography component="span" variant="body2" color="text.secondary">
                        Access Level: {user.accessLevel}
                      </Typography>
                      {user.accessLevel === 'limited' && user.devices && user.devices.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 0.5 }}>
                          {user.devices.map(deviceId => {
                            const device = allDevices.find(d => d.id === deviceId);
                            return device ? (
                              <Chip key={deviceId} label={device.name} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                            ) : null;
                          })}
                        </Box>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))
          )}
        </List>
      </Box>

      {/* Pending Invitations List */}
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom>Pending Invitations</Typography>
        <List>
          {invitations.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No pending invitations.</Typography>
          ) : (
            invitations.map((invite) => (
              <ListItem
                key={invite.id}
                secondaryAction={
                  <IconButton edge="end" aria-label="cancel" onClick={() => handleCancelInvitation(invite.id)}>
                    <CloseIcon />
                  </IconButton>
                }
              >
                <ListItemText primary={invite.email} secondary={`Status: ${invite.status}`} />
              </ListItem>
            ))
          )}
        </List>
      </Box>

      {/* Edit User Access Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} fullWidth maxWidth="sm">
        <DialogTitle>Edit User Access</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Editing access for: {editingUser?.name} ({editingUser?.email})
          </DialogContentText>
          <FormControl fullWidth margin="dense" variant="outlined">
            <InputLabel id="access-level-label">Access Level</InputLabel>
            <Select
              labelId="access-level-label"
              id="access-level-select"
              value={selectedAccessLevel}
              label="Access Level"
              onChange={handleAccessLevelChange}
            >
              <MenuItem value="full">Full Access</MenuItem>
              <MenuItem value="limited">Limited Access</MenuItem>
              <MenuItem value="view-only">View Only</MenuItem>
            </Select>
          </FormControl>
          {selectedAccessLevel === 'limited' && (
            <FormControl fullWidth margin="dense" variant="outlined" sx={{ mt: 2 }}>
              <InputLabel id="select-devices-label">Select Devices</InputLabel>
              <Select
                labelId="select-devices-label"
                id="select-devices"
                multiple
                value={selectedDevices}
                onChange={handleDeviceSelectionChange}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => {
                      const device = allDevices.find(d => d.id === value);
                      return device ? <Chip key={value} label={device.name} /> : null;
                    })}
                  </Box>
                )}
                label="Select Devices"
              >
                {allDevices.map((device) => (
                  <MenuItem key={device.id} value={device.id}>
                    {device.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleSaveUserAccess} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default AdvancedSharingSystem;