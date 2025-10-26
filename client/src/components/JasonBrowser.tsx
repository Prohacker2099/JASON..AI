
      setPageContent();

      
      setSummary(generatedSummary);

      
      const kg = cognitionEngine.getPersonalKnowledgeGraph('user-123'); 
      setKnowledgeGraphNodes(kg.nodes);

      updateDeviceState({ deviceId: 'jasonBrowser', newState: { active: true, currentUrl: url } });
      playSound('success');
    } catch (error) {
      console.error('Failed to fetch or process page:', error);
      setPageContent(`<html><body><h1>Error loading ${url}</h1><p>Could not load content. Please check the URL or your internet connection.</p></body></html>`);
      playSound('error');
    } finally {
      setIsLoading(false);
      stopSound();
    }
  }, [playSound, stopSound, triggerHapticFeedback, updateDeviceState]);

  useEffect(() => {
    fetchPageContent(currentUrl);
  }, [currentUrl, fetchPageContent]);

  const handleGo = () => {
    if (inputUrl && inputUrl !== currentUrl) {
      setCurrentUrl(inputUrl);
    }
  };

  const handleRefresh = () => {
    fetchPageContent(currentUrl);
  };

  const handleHome = () => {
    setCurrentUrl('https:
        const searchHtml = `<html><body><h1>Search Results for "${inputUrl}"</h1>${searchResults.map((res: any) => `<div><h2>${res.title || res.name}</h2><p>${res.snippet || res.properties?.summary || 'No snippet available.'}</p><p><small>Source: ${res.source || 'Internal Knowledge Graph'} (Credibility: ${res.credibilityScore})</small></p></div>`).join('')}</body></html>`;
        setPageContent(searchHtml);
        setSummary(`Search results for "${inputUrl}" have been collated.`);
        playSound('success');
      } catch (error) {
        console.error('Search failed:', error);
        setPageContent(`<html><body><h1>Search Error</h1><p>Failed to perform search. Please try again.</p></body></html>`);
        playSound('error');
      } finally {
        setIsLoading(false);
        stopSound();
      }
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#1e1e1e', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
      <Typography variant="h5" gutterBottom sx={{ color: '#90caf9' }}>
        JASON Cognition Engine & Browser
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <IconButton onClick={handleHome} color="primary" aria-label="Home">
          <HomeIcon />
        </IconButton>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          onKeyPress={(e) => { if (e.key === 'Enter') handleGo(); }}
          ="Enter URL or search query"
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: '#555' },
              '&:hover fieldset': { borderColor: '#777' },
              '&.Mui-focused fieldset': { borderColor: '#90caf9' },
            },
            '& .MuiInputBase-input': { color: 'white' },
          }}
        />
        <Button variant="contained" onClick={handleGo} disabled={isLoading}>Go</Button>
        <IconButton onClick={handleRefresh} disabled={isLoading} color="primary" aria-label="Refresh">
          <RefreshIcon />
        </IconButton>
        <IconButton onClick={handleSearch} disabled={isLoading} color="primary" aria-label="Search">
          <SearchIcon />
        </IconButton>
      </Box>

      <Paper
        elevation={3}
        sx={{
          height: '400px',
          backgroundColor: '#2a2a2a',
          color: 'white',
          p: 2,
          overflow: 'auto',
          position: 'relative',
          border: '1px solid #444',
        }}
      >
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
            >
              <CircularProgress color="primary" />
              <Typography sx={{ mt: 2 }}>Loading content...</Typography>
            </motion.div>
          ) : (
            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div dangerouslySetInnerHTML={{ __html: pageContent }} />
            </motion.div>
          )}
        </AnimatePresence>
      </Paper>

      {summary && (
        <Box sx={{ mt: 2, p: 2, backgroundColor: '#2a2a2a', borderRadius: '8px', border: '1px solid #444' }}>
          <Typography variant="h6" sx={{ color: '#f48fb1' }}>AI-Powered Summary:</Typography>
          <Typography variant="body2">{summary}</Typography>
        </Box>
      )}

      {knowledgeGraphNodes.length > 0 && (
        <Box sx={{ mt: 2, p: 2, backgroundColor: '#2a2a2a', borderRadius: '8px', border: '1px solid #444' }}>
          <Typography variant="h6" sx={{ color: '#f48fb1' }}>Knowledge Graph Insights:</Typography>
          <List>
            {knowledgeGraphNodes.slice(0, 5).map((node, index) => (
              <ListItem key={node.id} disablePadding>
                <ListItemText primary={`Node: ${node.name} (Type: ${node.type})`} secondary={node.properties?.summary || ''} />
              </ListItem>
            ))}
            {knowledgeGraphNodes.length > 5 && <Typography variant="body2" sx={{ fontStyle: 'italic' }}>...and {knowledgeGraphNodes.length - 5} more nodes.</Typography>}
          </List>
        </Box>
      )}
    </Box>
  );
};

export default JasonBrowser;
