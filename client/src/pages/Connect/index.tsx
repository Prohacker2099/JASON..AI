import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaComments, FaVideo, FaUsers, FaShareAlt, FaEnvelope, FaWhatsapp, FaFacebookMessenger, FaYoutube, FaTiktok } from 'react-icons/fa';
import './Connect.css';

const Connect: React.FC = () => {
  const [activeTab, setActiveTab] = useState('messages'); 
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button onClick={handleSendMessage}>Send</button>
              </div>
            </motion.div>
          </section>
        )}

        {activeTab === 'video' && (
          <section className="ai-video-calling">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2>AI-Powered Video Calling</h2>
              <div className="video-">
                <p>Video call interface will appear here.</p>
                <button>Start New Call</button>
              </div>
              <div className="call-features">
                <span>AI Noise Cancellation: Active</span>
                <span>Auto Translation: Off</span>
                <span>Intelligent Framing: On</span>
              </div>
            </motion.div>
          </section>
        )}

        {activeTab === 'communities' && (
          <section className="jason-communities">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2>JASON Communities</h2>
              <div className="community-list">
                <div className="community-item">
                  <motion.div whileHover={{ scale: 1.02 }}>
                    <h3>Smart Home Enthusiasts</h3>
                    <p>Discussion on new devices and automations.</p>
                  </motion.div>
                </div>
                <div className="community-item">
                  <motion.div whileHover={{ scale: 1.02 }}>
                    <h3>Local Gardeners Club</h3>
                    <p>Share tips and organize plant swaps.</p>
                  </motion.div>
                </div>
              </div>
              <button>Browse Communities</button>
            </motion.div>
          </section>
        )}

        {activeTab === 'social' && (
          <section className="social-media-integration">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2>Social Media Integration</h2>
              <div className="social-feed-">
                <p>Your integrated social media feeds (TikTok, YouTube) will appear here, intelligently filtered.</p>
                <div className="social-icons">
                  <FaTiktok size={30} />
                  <FaYoutube size={30} />
                </div>
              </div>
              <button>Configure Social Feeds</button>
            </motion.div>
          </section>
        )}

        {activeTab === 'files' && (
          <section className="enhanced-file-sharing">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2>Enhanced File Sharing</h2>
              <div className="file-share-area">
                <p>Drag & drop files here to share, or browse your shared files.</p>
                <button>Upload File</button>
                <button>View Shared Files</button>
              </div>
              <div className="shared-files-list">
                <div className="file-item">
                  <motion.div whileHover={{ x: 5 }}>
                    <span>Document_Q3_Report.pdf</span>
                    <FaShareAlt />
                  </motion.div>
                </div>
                <div className="file-item">
                  <motion.div whileHover={{ x: 5 }}>
                    <span>Family_Vacation_Video.mp4</span>
                    <FaShareAlt />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Connect;