/**
 * Cross-Device Communication Client
 *
 * Enables communication with the server and other devices
 * Supports:
 * - Real-time communication via WebSocket
 * - File transfer
 * - Screen sharing
 * - Remote control
 * - Push notifications
 */

class CrossDeviceCommunication {
  constructor() {
    this.websocket = null;
    this.deviceId = this.generateDeviceId();
    this.connected = false;
    this.messageHandlers = new Map();
    this.pendingResponses = new Map();
    this.fileTransfers = new Map();
    this.streams = new Map();
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 5;
    this.reconnectDelay = 2000;
    this.baseUrl = "/api/cross-device";
    this.eventListeners = new Map();

    // Register message handlers
    this.registerMessageHandlers();
  }

  /**
   * Initialize the communication service
   */
  async initialize() {
    try {
      // First register with the server via REST API
      const registered = await this.registerDevice();

      if (!registered) {
        console.error("Failed to register device with server");
        return false;
      }

      // Connect via WebSocket
      await this.connectWebSocket();

      return true;
    } catch (error) {
      console.error("Error initializing cross-device communication:", error);
      return false;
    }
  }

  /**
   * Register device with the server
   */
  async registerDevice() {
    try {
      const deviceInfo = this.getDeviceInfo();

      const response = await fetch(`${this.baseUrl}/devices/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceId: this.deviceId,
          ...deviceInfo,
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log("Device registered with server:", data.message);
        return true;
      } else {
        console.error("Failed to register device:", data.error);
        return false;
      }
    } catch (error) {
      console.error("Error registering device:", error);
      return false;
    }
  }

  /**
   * Connect to the server via WebSocket
   */
  async connectWebSocket() {
    return new Promise((resolve, reject) => {
      try {
        // Close existing connection if any
        if (this.websocket) {
          this.websocket.close();
        }

        // Create new WebSocket connection
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws?deviceId=${this.deviceId}&token=client-token&type=${this.getDeviceType()}`;

        this.websocket = new WebSocket(wsUrl);

        // Set up event handlers
        this.websocket.onopen = () => {
          console.log("WebSocket connection established");
          this.connected = true;
          this.connectionAttempts = 0;
          this.emit("connected");
          resolve(true);
        };

        this.websocket.onmessage = (event) => {
          this.handleWebSocketMessage(event.data);
        };

        this.websocket.onerror = (error) => {
          console.error("WebSocket error:", error);
          this.emit("error", error);
          reject(error);
        };

        this.websocket.onclose = () => {
          console.log("WebSocket connection closed");
          this.connected = false;
          this.emit("disconnected");

          // Try to reconnect
          if (this.connectionAttempts < this.maxConnectionAttempts) {
            this.connectionAttempts++;
            setTimeout(() => {
              this.connectWebSocket().catch((error) => {
                console.error("Error reconnecting:", error);
              });
            }, this.reconnectDelay * this.connectionAttempts);
          }
        };
      } catch (error) {
        console.error("Error connecting to WebSocket:", error);
        reject(error);
      }
    });
  }

  /**
   * Handle WebSocket messages
   */
  handleWebSocketMessage(data) {
    try {
      const message = JSON.parse(data);

      // Emit raw message event
      this.emit("message", message);

      // Check if this is a response to a pending request
      if (message.id && this.pendingResponses.has(message.id)) {
        const { resolve, reject, timeout } = this.pendingResponses.get(
          message.id,
        );

        // Clear timeout
        if (timeout) clearTimeout(timeout);

        // Resolve or reject based on message data
        if (message.data && message.data.error) {
          reject(new Error(message.data.error));
        } else {
          resolve(message.data);
        }

        // Remove from pending responses
        this.pendingResponses.delete(message.id);
        return;
      }

      // Handle based on message type
      if (this.messageHandlers.has(message.type)) {
        this.messageHandlers.get(message.type)(message);
      } else {
        console.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error("Error handling WebSocket message:", error);
    }
  }

  /**
   * Register message handlers
   */
  registerMessageHandlers() {
    // Command handler
    this.messageHandlers.set("command", (message) => {
      this.handleCommandMessage(message);
    });

    // File transfer handler
    this.messageHandlers.set("file", (message) => {
      this.handleFileMessage(message);
    });

    // Stream handler
    this.messageHandlers.set("stream", (message) => {
      this.handleStreamMessage(message);
    });

    // Notification handler
    this.messageHandlers.set("notification", (message) => {
      this.handleNotificationMessage(message);
    });

    // Event handler
    this.messageHandlers.set("event", (message) => {
      this.handleEventMessage(message);
    });
  }

  /**
   * Handle command messages from server
   */
  async handleCommandMessage(message) {
    try {
      const { data } = message;

      console.log(`Received command: ${data.command}`);
      this.emit("command", data);

      // Execute command based on type
      let response;

      switch (data.command) {
        case "take_photo":
          response = await this.takeCameraPhoto();
          break;
        case "record_video":
          response = await this.recordCameraVideo(data.parameters);
          break;
        case "get_location":
          response = await this.getCurrentLocation();
          break;
        case "get_battery_status":
          response = this.getBatteryStatus();
          break;
        case "open_app":
          response = await this.openApp(data.parameters);
          break;
        case "start_screen_sharing":
          response = await this.startScreenSharing(data.parameters);
          break;
        case "stop_screen_sharing":
          response = await this.stopScreenSharing(data.parameters);
          break;
        default:
          response = {
            success: false,
            error: `Unsupported command: ${data.command}`,
          };
      }

      // Send response
      this.sendMessage({
        id: this.generateMessageId(),
        type: "response",
        sender: this.deviceId,
        recipient: message.sender,
        timestamp: Date.now(),
        data: {
          commandId: message.id,
          ...response,
        },
      });
    } catch (error) {
      console.error("Error handling command message:", error);

      // Send error response
      this.sendMessage({
        id: this.generateMessageId(),
        type: "response",
        sender: this.deviceId,
        recipient: message.sender,
        timestamp: Date.now(),
        data: {
          commandId: message.id,
          success: false,
          error: error.message,
        },
      });
    }
  }

  /**
   * Handle file transfer messages
   */
  handleFileMessage(message) {
    try {
      const { data } = message;

      if (data.start) {
        // New file transfer
        console.log(
          `Starting file transfer: ${data.filename} (${data.fileSize} bytes)`,
        );
        this.emit("fileTransferStarted", {
          transferId: data.transferId,
          filename: data.filename,
          fileSize: data.fileSize,
          sender: message.sender,
        });

        // Initialize file storage
        this.fileTransfers.set(data.transferId, {
          filename: data.filename,
          fileSize: data.fileSize,
          chunks: [],
          receivedBytes: 0,
          started: Date.now(),
        });

        // Acknowledge start
        this.sendMessage({
          id: this.generateMessageId(),
          type: "response",
          sender: this.deviceId,
          recipient: message.sender,
          timestamp: Date.now(),
          data: {
            transferId: data.transferId,
            status: "started",
            message: "File transfer initiated",
          },
        });
      } else if (data.chunk && data.transferId) {
        // File chunk
        const transfer = this.fileTransfers.get(data.transferId);

        if (!transfer) {
          this.sendMessage({
            id: this.generateMessageId(),
            type: "response",
            sender: this.deviceId,
            recipient: message.sender,
            timestamp: Date.now(),
            data: {
              transferId: data.transferId,
              status: "error",
              message: "Transfer not found",
            },
          });
          return;
        }

        // Store chunk
        transfer.chunks.push(data.chunk);
        transfer.receivedBytes += data.chunk.length;
        this.fileTransfers.set(data.transferId, transfer);

        // Emit progress event
        this.emit("fileTransferProgress", {
          transferId: data.transferId,
          filename: transfer.filename,
          receivedBytes: transfer.receivedBytes,
          totalBytes: transfer.fileSize,
          percentage: Math.round(
            (transfer.receivedBytes / transfer.fileSize) * 100,
          ),
        });

        // Send progress acknowledgment if requested
        if (data.requiresAck) {
          this.sendMessage({
            id: this.generateMessageId(),
            type: "response",
            sender: this.deviceId,
            recipient: message.sender,
            timestamp: Date.now(),
            data: {
              transferId: data.transferId,
              status: "progress",
              receivedBytes: transfer.receivedBytes,
              totalBytes: transfer.fileSize,
              percentage: Math.round(
                (transfer.receivedBytes / transfer.fileSize) * 100,
              ),
            },
          });
        }
      } else if (data.complete && data.transferId) {
        // Transfer complete
        const transfer = this.fileTransfers.get(data.transferId);

        if (!transfer) {
          this.sendMessage({
            id: this.generateMessageId(),
            type: "response",
            sender: this.deviceId,
            recipient: message.sender,
            timestamp: Date.now(),
            data: {
              transferId: data.transferId,
              status: "error",
              message: "Transfer not found",
            },
          });
          return;
        }

        // Combine chunks into a single blob
        const blob = this.assembleFileFromChunks(transfer.chunks);
        const url = URL.createObjectURL(blob);

        // Emit completion event
        this.emit("fileTransferComplete", {
          transferId: data.transferId,
          filename: transfer.filename,
          fileSize: transfer.fileSize,
          blob,
          url,
          elapsedMs: Date.now() - transfer.started,
        });

        // Send completion acknowledgment
        this.sendMessage({
          id: this.generateMessageId(),
          type: "response",
          sender: this.deviceId,
          recipient: message.sender,
          timestamp: Date.now(),
          data: {
            transferId: data.transferId,
            status: "complete",
            message: "File transfer completed successfully",
          },
        });

        // Clean up
        this.fileTransfers.delete(data.transferId);
      }
    } catch (error) {
      console.error("Error handling file message:", error);
    }
  }

  /**
   * Handle streaming messages
   */
  handleStreamMessage(message) {
    try {
      const { data } = message;

      if (data.start) {
        // Starting a new stream
        console.log(`Starting stream: ${data.type}`);

        this.emit("streamStarted", {
          streamId: data.streamId,
          type: data.type,
          sender: message.sender,
        });

        // Acknowledge start
        this.sendMessage({
          id: this.generateMessageId(),
          type: "response",
          sender: this.deviceId,
          recipient: message.sender,
          timestamp: Date.now(),
          data: {
            streamId: data.streamId,
            status: "started",
            message: "Stream started",
          },
        });
      } else if (data.frame && data.streamId) {
        // Receive frame
        this.emit("streamFrame", {
          streamId: data.streamId,
          frame: data.frame,
          frameNumber: data.frameNumber,
          sender: message.sender,
        });

        // Acknowledge frame if needed
        if (data.requiresAck) {
          this.sendMessage({
            id: this.generateMessageId(),
            type: "response",
            sender: this.deviceId,
            recipient: message.sender,
            timestamp: Date.now(),
            data: {
              streamId: data.streamId,
              status: "frame_received",
              frameNumber: data.frameNumber,
            },
          });
        }
      } else if (data.stop && data.streamId) {
        // Stream ended
        this.emit("streamStopped", {
          streamId: data.streamId,
          type: data.type,
          sender: message.sender,
        });

        // Acknowledge stop
        this.sendMessage({
          id: this.generateMessageId(),
          type: "response",
          sender: this.deviceId,
          recipient: message.sender,
          timestamp: Date.now(),
          data: {
            streamId: data.streamId,
            status: "stopped",
            message: "Stream stopped",
          },
        });
      }
    } catch (error) {
      console.error("Error handling stream message:", error);
    }
  }

  /**
   * Handle notification messages
   */
  handleNotificationMessage(message) {
    try {
      const { data } = message;

      console.log(`Received notification: ${data.title}`);

      // Display notification to user
      this.showNotification(data.title, data.body, data);

      // Emit notification event
      this.emit("notification", {
        title: data.title,
        body: data.body,
        sender: message.sender,
        timestamp: message.timestamp,
        data: data,
      });

      // Acknowledge notification
      this.sendMessage({
        id: this.generateMessageId(),
        type: "response",
        sender: this.deviceId,
        recipient: message.sender,
        timestamp: Date.now(),
        data: {
          notificationId: message.id,
          status: "received",
          message: "Notification received",
        },
      });
    } catch (error) {
      console.error("Error handling notification message:", error);
    }
  }

  /**
   * Handle event messages
   */
  handleEventMessage(message) {
    try {
      const { data } = message;

      console.log(`Received event: ${data.event}`);

      // Emit event
      this.emit("serverEvent", {
        event: data.event,
        sender: message.sender,
        timestamp: message.timestamp,
        data: data,
      });

      // Acknowledge event
      this.sendMessage({
        id: this.generateMessageId(),
        type: "response",
        sender: this.deviceId,
        recipient: message.sender,
        timestamp: Date.now(),
        data: {
          eventId: message.id,
          status: "received",
          message: "Event received",
        },
      });
    } catch (error) {
      console.error("Error handling event message:", error);
    }
  }

  /**
   * Send a message to the server
   */
  sendMessage(message) {
    if (!this.connected || !this.websocket) {
      console.error("Cannot send message: WebSocket not connected");
      return false;
    }

    try {
      this.websocket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      return false;
    }
  }

  /**
   * Send a command to another device via the server
   */
  async sendCommand(deviceId, command, parameters = {}) {
    const messageId = this.generateMessageId();

    return new Promise((resolve, reject) => {
      // Set up timeout
      const timeout = setTimeout(() => {
        this.pendingResponses.delete(messageId);
        reject(new Error(`Command timed out: ${command}`));
      }, 30000); // 30 second timeout

      // Store promise callbacks
      this.pendingResponses.set(messageId, { resolve, reject, timeout });

      // Send command message
      const sent = this.sendMessage({
        id: messageId,
        type: "command",
        sender: this.deviceId,
        recipient: deviceId,
        timestamp: Date.now(),
        data: {
          command,
          parameters,
        },
      });

      if (!sent) {
        clearTimeout(timeout);
        this.pendingResponses.delete(messageId);
        reject(new Error("Failed to send command: WebSocket not connected"));
      }
    });
  }

  /**
   * Send a file to another device
   */
  async sendFile(deviceId, file) {
    if (!file) {
      throw new Error("No file provided");
    }

    const transferId = this.generateMessageId();
    const chunkSize = 64 * 1024; // 64KB chunks

    // Notify recipient about incoming file
    const messageId = this.generateMessageId();

    return new Promise((resolve, reject) => {
      // Set up timeout for initial confirmation
      const timeout = setTimeout(() => {
        this.pendingResponses.delete(messageId);
        reject(new Error("File transfer initiation timed out"));
      }, 30000);

      // Store promise callbacks
      this.pendingResponses.set(messageId, {
        resolve: () => {
          // Start sending file chunks after confirmation
          this.sendFileChunks(deviceId, file, transferId, chunkSize)
            .then(resolve)
            .catch(reject);
        },
        reject,
        timeout,
      });

      // Send file start message
      const sent = this.sendMessage({
        id: messageId,
        type: "file",
        sender: this.deviceId,
        recipient: deviceId,
        timestamp: Date.now(),
        data: {
          start: true,
          transferId,
          filename: file.name,
          fileSize: file.size,
          mimeType: file.type,
        },
      });

      if (!sent) {
        clearTimeout(timeout);
        this.pendingResponses.delete(messageId);
        reject(
          new Error(
            "Failed to initiate file transfer: WebSocket not connected",
          ),
        );
      }
    });
  }

  /**
   * Send file chunks to a device
   */
  async sendFileChunks(deviceId, file, transferId, chunkSize) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      let offset = 0;

      // Create a function to read and send the next chunk
      const readNextChunk = () => {
        if (offset >= file.size) {
          // File transfer complete
          const messageId = this.generateMessageId();

          // Set up timeout for completion confirmation
          const timeout = setTimeout(() => {
            this.pendingResponses.delete(messageId);
            reject(
              new Error("File transfer completion confirmation timed out"),
            );
          }, 30000);

          // Store promise callbacks
          this.pendingResponses.set(messageId, {
            resolve: () => {
              resolve({
                transferId,
                filename: file.name,
                fileSize: file.size,
                success: true,
              });
            },
            reject,
            timeout,
          });

          // Send completion message
          const sent = this.sendMessage({
            id: messageId,
            type: "file",
            sender: this.deviceId,
            recipient: deviceId,
            timestamp: Date.now(),
            data: {
              transferId,
              complete: true,
              filename: file.name,
              fileSize: file.size,
            },
          });

          if (!sent) {
            clearTimeout(timeout);
            this.pendingResponses.delete(messageId);
            reject(
              new Error(
                "Failed to complete file transfer: WebSocket not connected",
              ),
            );
          }

          return;
        }

        // Calculate the chunk size
        const chunk = file.slice(offset, offset + chunkSize);

        // Read the chunk
        reader.readAsDataURL(chunk);
      };

      // Set up reader onload handler
      reader.onload = async () => {
        if (reader.result) {
          // Extract base64 data (remove the data URL prefix)
          const base64data = reader.result.toString().split(",")[1];

          // Determine if we need acknowledgment for this chunk
          // Request acknowledgment every 1MB
          const requiresAck = offset % (1024 * 1024) < chunkSize;

          if (requiresAck) {
            try {
              // Send chunk with acknowledgment
              const messageId = this.generateMessageId();

              await new Promise((resolveChunk, rejectChunk) => {
                // Set up timeout for chunk acknowledgment
                const timeout = setTimeout(() => {
                  this.pendingResponses.delete(messageId);
                  rejectChunk(new Error("Chunk acknowledgment timed out"));
                }, 30000);

                // Store promise callbacks
                this.pendingResponses.set(messageId, {
                  resolve: resolveChunk,
                  reject: rejectChunk,
                  timeout,
                });

                // Send chunk
                const sent = this.sendMessage({
                  id: messageId,
                  type: "file",
                  sender: this.deviceId,
                  recipient: deviceId,
                  timestamp: Date.now(),
                  data: {
                    transferId,
                    chunk: base64data,
                    offset,
                    size: chunk.size,
                    requiresAck: true,
                  },
                });

                if (!sent) {
                  clearTimeout(timeout);
                  this.pendingResponses.delete(messageId);
                  rejectChunk(
                    new Error("Failed to send chunk: WebSocket not connected"),
                  );
                }
              });
            } catch (error) {
              reject(error);
              return;
            }
          } else {
            // Send chunk without waiting for acknowledgment
            this.sendMessage({
              id: this.generateMessageId(),
              type: "file",
              sender: this.deviceId,
              recipient: deviceId,
              timestamp: Date.now(),
              data: {
                transferId,
                chunk: base64data,
                offset,
                size: chunk.size,
                requiresAck: false,
              },
            });
          }

          // Update offset and emit progress
          offset += chunk.size;

          this.emit("fileSendProgress", {
            transferId,
            filename: file.name,
            sentBytes: offset,
            totalBytes: file.size,
            percentage: Math.round((offset / file.size) * 100),
          });

          // Read the next chunk
          readNextChunk();
        }
      };

      // Handle errors
      reader.onerror = (error) => {
        reject(error);
      };

      // Start reading the first chunk
      readNextChunk();
    });
  }

  /**
   * Start screen sharing
   */
  async startScreenSharing(options = {}) {
    try {
      // Request screen capture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: options.withAudio || false,
      });

      // Store stream for later use
      const streamId = options.streamId || this.generateMessageId();
      this.streams.set(streamId, {
        stream,
        type: "screen",
        started: Date.now(),
        frames: 0,
      });

      // Set up screen capture
      const track = stream.getVideoTracks()[0];

      // Handle track ending (user stops sharing)
      track.onended = () => {
        this.stopScreenSharing({ streamId });
      };

      // Start sending frames
      this.captureAndSendScreenFrames(streamId, options.targetDevice);

      return {
        success: true,
        streamId,
        message: "Screen sharing started",
      };
    } catch (error) {
      console.error("Error starting screen sharing:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Capture and send screen frames
   */
  captureAndSendScreenFrames(streamId, targetDevice, frameRate = 5) {
    const streamInfo = this.streams.get(streamId);
    if (!streamInfo) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const video = document.createElement("video");

    video.srcObject = streamInfo.stream;
    video.play();

    // Set dimensions once video metadata is loaded
    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    };

    // Calculate frame capture interval
    const interval = 1000 / frameRate;

    // Start capture loop
    const captureFrame = () => {
      if (!this.streams.has(streamId)) return; // Stream stopped

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get frame as JPEG data URL (quality 0.6 for better performance)
      const frameData = canvas.toDataURL("image/jpeg", 0.6);

      // Extract base64 data
      const base64Frame = frameData.split(",")[1];

      // Send frame
      streamInfo.frames++;
      this.sendMessage({
        id: this.generateMessageId(),
        type: "stream",
        sender: this.deviceId,
        recipient: targetDevice || "server",
        timestamp: Date.now(),
        data: {
          streamId,
          frame: base64Frame,
          frameNumber: streamInfo.frames,
          requiresAck: streamInfo.frames % 30 === 0, // Request ack every 30 frames
        },
      });

      // Schedule next frame capture
      streamInfo.captureTimeout = setTimeout(captureFrame, interval);
      this.streams.set(streamId, streamInfo);
    };

    // Start capture loop
    captureFrame();
  }

  /**
   * Stop screen sharing
   */
  stopScreenSharing(options = {}) {
    const { streamId } = options;
    if (!streamId || !this.streams.has(streamId)) {
      return {
        success: false,
        error: "Stream not found",
      };
    }

    const streamInfo = this.streams.get(streamId);

    // Stop media tracks
    streamInfo.stream.getTracks().forEach((track) => track.stop());

    // Clear timeout if exists
    if (streamInfo.captureTimeout) {
      clearTimeout(streamInfo.captureTimeout);
    }

    // Send stop message
    this.sendMessage({
      id: this.generateMessageId(),
      type: "stream",
      sender: this.deviceId,
      recipient: options.targetDevice || "server",
      timestamp: Date.now(),
      data: {
        streamId,
        stop: true,
        frames: streamInfo.frames,
        duration: Date.now() - streamInfo.started,
      },
    });

    // Remove stream info
    this.streams.delete(streamId);

    return {
      success: true,
      message: "Screen sharing stopped",
    };
  }

  /**
   * Take a photo using the device camera
   */
  async takeCameraPhoto() {
    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      // Create video and canvas elements
      const video = document.createElement("video");
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      return new Promise((resolve, reject) => {
        video.srcObject = stream;
        video.play();

        video.onloadedmetadata = () => {
          // Set canvas dimensions
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          // Wait a moment for camera to adjust
          setTimeout(() => {
            // Capture frame
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Get image data
            const imageData = canvas.toDataURL("image/jpeg", 0.9);

            // Stop all tracks
            stream.getTracks().forEach((track) => track.stop());

            resolve({
              success: true,
              imageData,
              width: canvas.width,
              height: canvas.height,
              timestamp: Date.now(),
            });
          }, 500);
        };

        video.onerror = () => {
          stream.getTracks().forEach((track) => track.stop());
          reject(new Error("Failed to access camera"));
        };
      });
    } catch (error) {
      console.error("Error taking photo:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Record video using the device camera
   */
  async recordCameraVideo(options = {}) {
    try {
      const duration = options.duration || 5000; // Default 5 seconds

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: options.withAudio || false,
      });

      // Create a MediaRecorder
      const chunks = [];
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      return new Promise((resolve, reject) => {
        recorder.onstop = () => {
          // Stop all tracks
          stream.getTracks().forEach((track) => track.stop());

          // Create blob
          const blob = new Blob(chunks, { type: "video/webm" });

          // Convert to base64
          const reader = new FileReader();
          reader.readAsDataURL(blob);

          reader.onloadend = () => {
            resolve({
              success: true,
              videoData: reader.result,
              duration,
              mimeType: "video/webm",
              timestamp: Date.now(),
            });
          };

          reader.onerror = () => {
            reject(new Error("Failed to process video data"));
          };
        };

        recorder.onerror = (e) => {
          stream.getTracks().forEach((track) => track.stop());
          reject(new Error(`Recording error: ${e.error}`));
        };

        // Start recording
        recorder.start();

        // Stop after duration
        setTimeout(() => {
          if (recorder.state !== "inactive") {
            recorder.stop();
          }
        }, duration);
      });
    } catch (error) {
      console.error("Error recording video:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get device's current location
   */
  async getCurrentLocation() {
    try {
      if (!navigator.geolocation) {
        return {
          success: false,
          error: "Geolocation is not supported by this device",
        };
      }

      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              success: true,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude,
              altitudeAccuracy: position.coords.altitudeAccuracy,
              heading: position.coords.heading,
              speed: position.coords.speed,
              timestamp: position.timestamp,
            });
          },
          (error) => {
            let errorMessage;
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = "User denied the request for geolocation";
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = "Location information is unavailable";
                break;
              case error.TIMEOUT:
                errorMessage = "The request to get user location timed out";
                break;
              default:
                errorMessage = "An unknown error occurred";
            }

            reject(new Error(errorMessage));
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          },
        );
      });
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get battery status
   */
  getBatteryStatus() {
    if (navigator.getBattery) {
      return navigator
        .getBattery()
        .then((battery) => ({
          success: true,
          level: battery.level * 100,
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime,
          timestamp: Date.now(),
        }))
        .catch((error) => ({
          success: false,
          error: error.message,
        }));
    } else {
      return Promise.resolve({
        success: false,
        error: "Battery API not supported on this device",
      });
    }
  }

  /**
   * Open an app or URL
   */
  async openApp(options = {}) {
    try {
      const url = options.url || options.appUrl;

      if (!url) {
        return {
          success: false,
          error: "No URL provided",
        };
      }

      // Try to open the URL
      window.open(url, "_blank");

      return {
        success: true,
        message: `Opened ${url}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Show a notification
   */
  showNotification(title, body, options = {}) {
    try {
      // Check if notifications are supported
      if (!("Notification" in window)) {
        console.warn("Notifications not supported in this browser");
        return false;
      }

      // Check permission
      if (Notification.permission === "granted") {
        // Create and show notification
        const notification = new Notification(title, {
          body,
          icon: options.icon || "/favicon.ico",
          tag: options.tag || "default",
          requireInteraction: options.requireInteraction || false,
        });

        // Add click handler
        notification.onclick = () => {
          this.emit("notificationClicked", {
            title,
            body,
            ...options,
          });

          if (options.url) {
            window.open(options.url, "_blank");
          }

          notification.close();
        };

        return true;
      } else if (Notification.permission !== "denied") {
        // Request permission
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            this.showNotification(title, body, options);
          }
        });
      }

      return false;
    } catch (error) {
      console.error("Error showing notification:", error);
      return false;
    }
  }

  /**
   * Send a notification to another device
   */
  async sendNotification(deviceId, title, body, options = {}) {
    try {
      const response = await fetch(
        `${this.baseUrl}/devices/${deviceId}/notify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            body,
            options,
          }),
        },
      );

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error("Error sending notification:", error);
      return false;
    }
  }

  /**
   * Send a command to a device via REST API
   */
  async sendDeviceCommand(deviceId, command, parameters = {}) {
    try {
      const response = await fetch(
        `${this.baseUrl}/devices/${deviceId}/command`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            command,
            parameters,
          }),
        },
      );

      return await response.json();
    } catch (error) {
      console.error("Error sending device command:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Remote control a device
   */
  async remoteControl(deviceId, action, parameters = {}) {
    try {
      const response = await fetch(
        `${this.baseUrl}/devices/${deviceId}/remote-control`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            parameters,
          }),
        },
      );

      return await response.json();
    } catch (error) {
      console.error("Error remote controlling device:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Upload a file to a device
   */
  async uploadFile(deviceId, file) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${this.baseUrl}/devices/${deviceId}/transfer-file`,
        {
          method: "POST",
          body: formData,
        },
      );

      return await response.json();
    } catch (error) {
      console.error("Error uploading file:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Request screen sharing from a device
   */
  async requestScreenSharing(deviceId) {
    try {
      const response = await fetch(
        `${this.baseUrl}/devices/${deviceId}/screen-share`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      return await response.json();
    } catch (error) {
      console.error("Error requesting screen sharing:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get all connected devices
   */
  async getConnectedDevices() {
    try {
      const response = await fetch(`${this.baseUrl}/devices`);
      return await response.json();
    } catch (error) {
      console.error("Error getting connected devices:", error);
      return {
        success: false,
        error: error.message,
        devices: [],
      };
    }
  }

  /**
   * Check if a device is connected
   */
  async isDeviceConnected(deviceId) {
    try {
      const response = await fetch(
        `${this.baseUrl}/devices/${deviceId}/status`,
      );
      const data = await response.json();
      return data.connected;
    } catch (error) {
      console.error("Error checking device connection:", error);
      return false;
    }
  }

  /**
   * Get the list of supported capabilities
   */
  async getCapabilities() {
    try {
      const response = await fetch(`${this.baseUrl}/capabilities`);
      return await response.json();
    } catch (error) {
      console.error("Error getting capabilities:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Add event listener
   */
  on(event, listener) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }

    this.eventListeners.get(event).add(listener);
    return this;
  }

  /**
   * Remove event listener
   */
  off(event, listener) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(listener);
    }
    return this;
  }

  /**
   * Emit event
   */
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach((listener) => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
    return this;
  }

  /**
   * Generate a unique device ID
   */
  generateDeviceId() {
    // Try to load from local storage
    const storedId = localStorage.getItem("deviceId");
    if (storedId) return storedId;

    // Generate a new ID
    const newId = `device-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem("deviceId", newId);
    return newId;
  }

  /**
   * Generate a unique message ID
   */
  generateMessageId() {
    return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Assemble file from chunks
   */
  assembleFileFromChunks(chunks) {
    // Convert base64 chunks to binary
    const binaryChunks = chunks.map((chunk) => this.base64ToBinary(chunk));

    // Create a blob from the binary chunks
    return new Blob(binaryChunks);
  }

  /**
   * Convert base64 to binary
   */
  base64ToBinary(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes;
  }

  /**
   * Get device information
   */
  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      vendor: navigator.vendor,
      language: navigator.language,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      online: navigator.onLine,
      hasTouch: "ontouchstart" in window,
      hasBluetooth: "bluetooth" in navigator,
      hasWebRTC: "RTCPeerConnection" in window,
      hasGeolocation: "geolocation" in navigator,
      timestamp: Date.now(),
    };
  }

  /**
   * Get device type
   */
  getDeviceType() {
    const ua = navigator.userAgent;

    if (/Mobi|Android/i.test(ua)) {
      return "smartphone";
    } else if (/iPad|Tablet/i.test(ua)) {
      return "tablet";
    } else {
      return "computer";
    }
  }
}

// Create singleton instance
const crossDeviceCommunication = new CrossDeviceCommunication();

export default crossDeviceCommunication;
