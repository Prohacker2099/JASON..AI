import React, { useState, useCallback } from 'react';
import { Box, Typography, Tabs, Tab, Paper, TextField, IconButton, List, ListItem, ListItemText, Avatar, Divider, InputAdornment } from '@mui/material';
import { styled } from '@mui/material/styles';
import MessageIcon from '@mui/icons-material/Message';
import CallIcon from '@mui/icons-material/Call';
import PeopleIcon from '@mui/icons-material/People';
import ShareIcon from '@mui/icons-material/Share';
import SendIcon from '@mui/icons-material/Send';
import VideocamIcon from '@mui/icons-material/Videocam';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import useHapticFeedback from '../hooks/useHapticFeedback';
import useAmbientSound from '../hooks/useAmbientSound';
import '../styles/JasonConnectPage.css'; 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#00c6ff' },
                    '&:hover fieldset': { borderColor: '#00aaff' },
                    '&.Mui-focused fieldset': { borderColor: '#00c6ff' },
                    color: 'white',
                  },
                  '& .MuiInputBase-input': {
                    color: 'white',
                  },
                  '& .MuiInputLabel-root': {
                    color: '#b0b0b0',
                  },
                  backgroundColor: '#2a2a2a',
                  borderRadius: '8px',
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleSendMessage} sx={{ color: '#00c6ff' }}>
                        <SendIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          )}

          {currentTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ color: '#00c6ff' }}>AI-Powered Video Calling</Typography>
              <List>
                {contacts.map((contact) => (
                  <ListItem key={contact.id} secondaryAction={
                    <IconButton edge="end" aria-label="call" onClick={() => handleVideoCall(contact.name)} sx={{ color: '#00c6ff' }}>
                      <VideocamIcon />
                    </IconButton>
                  }>
                    <Avatar alt={contact.name} src={contact.avatar} sx={{ mr: 2 }} />
                    <ListItemText primary={contact.name} secondary={contact.status} sx={{ '& .MuiListItemText-primary': { color: 'white' }, '& .MuiListItemText-secondary': { color: '#b0b0b0' } }} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {currentTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ color: '#00c6ff' }}>JASON Communities</Typography>
              <List>
                {communities.map((community) => (
                  <ListItem key={community.id} secondaryAction={
                    <IconButton edge="end" aria-label="join" sx={{ color: '#00c6ff' }}>
                      <AddCircleOutlineIcon />
                    </IconButton>
                  }>
                    <Avatar alt={community.name} src={community.avatar} sx={{ mr: 2 }} />
                    <ListItemText
                      primary={community.name}
                      secondary={`${community.members} members - ${community.description}`}
                      sx={{ '& .MuiListItemText-primary': { color: 'white' }, '& .MuiListItemText-secondary': { color: '#b0b0b0' } }}
                    />
                  </ListItem>
                ))}
              </List>
              <TextField
                fullWidth
                variant="outlined"
                ="Search or create community..."
                sx={{
                  marginTop: '20px',
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#00c6ff' },
                    '&:hover fieldset': { borderColor: '#00aaff' },
                    '&.Mui-focused fieldset': { borderColor: '#00c6ff' },
                    color: 'white',
                  },
                  '& .MuiInputBase-input': {
                    color: 'white',
                  },
                  '& .MuiInputLabel-root': {
                    color: '#b0b0b0',
                  },
                  backgroundColor: '#2a2a2a',
                  borderRadius: '8px',
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <SearchIcon sx={{ color: '#b0b0b0' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          )}

          {currentTab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ color: '#00c6ff' }}>Enhanced File Sharing</Typography>
              <Typography variant="body1" paragraph sx={{ color: '#b0b0b0' }}>
                JASON makes sharing large and complex files effortless. It supports high-speed transfers and intelligently organizes shared files, making them easily searchable.
              </Typography>
              <IconButton onClick={handleShareFile} sx={{ color: '#00c6ff', border: '1px solid #00c6ff', borderRadius: '8px', padding: '10px 20px' }}>
                <ShareIcon sx={{ mr: 1 }} /> Share a File
              </IconButton>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default JasonConnectPage;