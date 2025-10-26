import { Communication } from '../types/Communication';

class CommunicationHubService {
  private communications: Communication[] = [
    {
      id: 'msg-1',
      source: 'Mom',
      preview: 'Don\'t forget about dinner this weekend',
      unread: true,
      timestamp: Date.now() - 15 * 60 * 1000 // 15 minutes ago
    },
    {
      id: 'msg-2',
      source: 'Work Team',
      preview: 'Project update meeting at 2 PM',
      unread: true,
      timestamp: Date.now() - 30 * 60 * 1000 // 30 minutes ago
    },
    {
      id: 'msg-3',
      source: 'Smart Home',
      preview: 'Security system update available',
      unread: false,
      timestamp: Date.now() - 2 * 60 * 60 * 1000 // 2 hours ago
    }
  ];

  private listeners: ((communications: Communication[]) => void)[] = [];

  async getRecentCommunications(): Promise<Communication[]> {
    return [...this.communications];
  }

  onCommunicationUpdate(listener: (communications: Communication[]) => void) {
    this.listeners.push(listener);
    return {
      unsubscribe: () => {
        this.listeners = this.listeners.filter(l => l !== listener);
      }
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.communications]));
  }
}

export default new CommunicationHubService();
