import { EventEmitter } from 'events'
import { spawn, exec } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { WindowsUIAutomationAdapter } from '../agents/WindowsUIAutomationAgent'

export interface GhostWorkspace {
  id: string
  name: string
  platform: 'windows' | 'linux' | 'macos'
  isActive: boolean
  processId?: number
  display?: number
  desktopName?: string
  createdAt: Date
  lastUsed: Date
}

export interface JitterConfig {
  enabled: boolean
  mouseJitter: boolean
  typingJitter: boolean
  bezierCurves: boolean
  gaussianDelay: boolean
  humanizationLevel: number // 0-1
  minDelay: number
  maxDelay: number
  variance: number
}

export interface AntiBotConfig {
  enabled: boolean
  randomDelays: boolean
  mouseSpeedVariation: boolean
  clickPatterns: boolean
  typingRhythm: boolean
  scrollBehavior: boolean
  userAgentRotation: boolean
  ipRotation: boolean
  fingerprintObfuscation: boolean
}

export interface GhostHandConfig {
  maxWorkspaces: number
  defaultWorkspace: string
  jitter: JitterConfig
  antiBot: AntiBotConfig
  security: {
    allowScreenCapture: boolean
    allowFileAccess: boolean
    allowNetworkAccess: boolean
    sandboxMode: boolean
    auditLogging: boolean
  }
  performance: {
    maxConcurrentActions: number
    actionTimeout: number
    cleanupInterval: number
    memoryLimit: number
  }
}

const DEFAULT_CONFIG: GhostHandConfig = {
  maxWorkspaces: 5,
  defaultWorkspace: 'Jason_Workspace',
  jitter: {
    enabled: true,
    mouseJitter: true,
    typingJitter: true,
    bezierCurves: true,
    gaussianDelay: true,
    humanizationLevel: 0.7,
    minDelay: 50,
    maxDelay: 300,
    variance: 0.3
  },
  antiBot: {
    enabled: true,
    randomDelays: true,
    mouseSpeedVariation: true,
    clickPatterns: true,
    typingRhythm: true,
    scrollBehavior: true,
    userAgentRotation: false,
    ipRotation: false,
    fingerprintObfuscation: true
  },
  security: {
    allowScreenCapture: true,
    allowFileAccess: true,
    allowNetworkAccess: true,
    sandboxMode: false,
    auditLogging: true
  },
  performance: {
    maxConcurrentActions: 10,
    actionTimeout: 30000,
    cleanupInterval: 60000,
    memoryLimit: 512 * 1024 * 1024 // 512MB
  }
}

export class GhostHandManager extends EventEmitter {
  private config: GhostHandConfig
  private workspaces: Map<string, GhostWorkspace> = new Map()
  private activeWorkspace: GhostWorkspace | null = null
  private isInitialized = false
  private cleanupTimer: NodeJS.Timeout | null = null
  private vlmAdapter: WindowsUIAutomationAdapter
  private auditLog: string[] = []

  constructor(config: Partial<GhostHandConfig> = {}) {
    super()
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.vlmAdapter = new WindowsUIAutomationAdapter()
    this.initializeCleanupTimer()
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Initialize platform-specific components
      await this.initializePlatform()
      
      // Create default workspace
      await this.createWorkspace(this.config.defaultWorkspace)
      
      this.isInitialized = true
      this.emit('initialized')
      this.log('GhostHand Manager initialized successfully')
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error('Failed to initialize GhostHand'))
    }
  }

  private async initializePlatform(): Promise<void> {
    const platform = this.getPlatform()
    
    switch (platform) {
      case 'windows':
        await this.initializeWindows()
        break
      case 'linux':
        await this.initializeLinux()
        break
      case 'macos':
        await this.initializeMacOS()
        break
      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }
  }

  private getPlatform(): 'windows' | 'linux' | 'macos' {
    switch (process.platform) {
      case 'win32':
        return 'windows'
      case 'linux':
        return 'linux'
      case 'darwin':
        return 'macos'
      default:
        throw new Error(`Unsupported platform: ${process.platform}`)
    }
  }

  private async initializeWindows(): Promise<void> {
    // Windows-specific initialization using CreateDesktop API
    const script = `
      Add-Type -TypeDefinition '
        using System;
        using System.Runtime.InteropServices;
        
        public class DesktopManager {
          [DllImport("user32.dll")]
          public static extern IntPtr CreateDesktop(string lpszDesktop, IntPtr lpszDevice, IntPtr pDevmode, int dwFlags, int dwDesiredAccess, IntPtr lpsa);
          
          [DllImport("user32.dll")]
          public static extern bool SwitchDesktop(IntPtr hDesktop);
          
          [DllImport("user32.dll")]
          public static extern IntPtr OpenDesktop(string lpszDesktop, int dwFlags, bool fInherit, uint dwDesiredAccess);
          
          [DllImport("user32.dll")]
          public static extern bool CloseDesktop(IntPtr hDesktop);
          
          [DllImport("user32.dll")]
          public static extern IntPtr GetThreadDesktop(int dwThreadId);
          
          [DllImport("kernel32.dll")]
          public static extern int GetCurrentThreadId();
          
          public const uint DESKTOP_CREATEWINDOW = 0x0002L;
          public const uint DESKTOP_SWITCHDESKTOP = 0x0100L;
        }
      '
      
      # Create a new desktop for JASON operations
      $jasonDesktop = [DesktopManager]::CreateDesktop("Jason_Workspace", IntPtr.Zero, IntPtr.Zero, 0, 
        [DesktopManager]::DESKTOP_CREATEWINDOW -bor [DesktopManager]::DESKTOP_SWITCHDESKTOP, IntPtr.Zero)
      
      if ($jasonDesktop -ne [IntPtr]::Zero) {
        Write-Output "SUCCESS: Jason_Workspace desktop created"
      } else {
        Write-Output "ERROR: Failed to create desktop"
      }
    `

    const result = await this.runPowerShell(script)
    if (result.stdout.includes('SUCCESS')) {
      this.log('Windows desktop workspace initialized')
    } else {
      throw new Error('Failed to create Windows desktop workspace')
    }
  }

  private async initializeLinux(): Promise<void> {
    // Linux-specific initialization using Xvfb
    try {
      // Check if Xvfb is available
      await this.checkCommandExists('Xvfb')
      
      // Start Xvfb with virtual display
      const display = 99 // Use display :99
      const xauth = path.join(os.tmpdir(), 'jason-xauth')
      
      // Create X authority file
      await fs.writeFile(xauth, '')
      
      const cmd = `Xvfb :${display} -screen 0 1920x1080x24 -auth ${xauth} -ac +extension GLX +render -noreset`
      
      const child = spawn(cmd, [], { shell: true, detached: true })
      child.unref()
      
      // Wait a moment for Xvfb to start
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      this.log(`Linux Xvfb workspace initialized on display :${display}`)
    } catch (error) {
      throw new Error(`Failed to initialize Linux workspace: ${error}`)
    }
  }

  private async initializeMacOS(): Promise<void> {
    // macOS-specific initialization using CGEvent or virtual displays
    try {
      // Create a new space/desktop using AppleScript
      const script = `
        tell application "System Events"
          tell expose preferences
            set spaces to count of spaces
            if spaces < 16 then
              -- Create new space
              keystroke "d" using {control down, option down}
              delay 1
              return "SUCCESS: New space created"
            else
              return "ERROR: Maximum spaces reached"
            end if
          end tell
        end tell
      `

      const result = await this.runAppleScript(script)
      if (result.includes('SUCCESS')) {
        this.log('macOS workspace initialized')
      } else {
        throw new Error('Failed to create macOS workspace')
      }
    } catch (error) {
      throw new Error(`Failed to initialize macOS workspace: ${error}`)
    }
  }

  // WORKSPACE MANAGEMENT

  async createWorkspace(name: string): Promise<GhostWorkspace> {
    if (this.workspaces.size >= this.config.maxWorkspaces) {
      throw new Error('Maximum workspaces reached')
    }

    const workspaceId = `workspace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const platform = this.getPlatform()
    
    const workspace: GhostWorkspace = {
      id: workspaceId,
      name,
      platform,
      isActive: false,
      createdAt: new Date(),
      lastUsed: new Date()
    }

    // Platform-specific workspace creation
    switch (platform) {
      case 'windows':
        await this.createWindowsWorkspace(workspace)
        break
      case 'linux':
        await this.createLinuxWorkspace(workspace)
        break
      case 'macos':
        await this.createMacOSWorkspace(workspace)
        break
    }

    this.workspaces.set(workspaceId, workspace)
    this.emit('workspace_created', workspace)
    this.log(`Workspace created: ${name} (${workspaceId})`)
    
    return workspace
  }

  private async createWindowsWorkspace(workspace: GhostWorkspace): Promise<void> {
    const script = `
      Add-Type -AssemblyName System.Windows.Forms
      
      # Switch to the Jason desktop
      $desktop = [System.Windows.Forms.Desktop]::GetDesktop("${workspace.name}")
      if ($desktop) {
        [System.Windows.Forms.Desktop]::SetCurrentDesktop($desktop)
        Write-Output "SUCCESS: Switched to ${workspace.name}"
      } else {
        Write-Output "ERROR: Desktop not found"
      }
    `

    const result = await this.runPowerShell(script)
    if (result.stdout.includes('SUCCESS')) {
      workspace.isActive = true
      workspace.desktopName = workspace.name
    }
  }

  private async createLinuxWorkspace(workspace: GhostWorkspace): Promise<void> {
    const display = 99 + this.workspaces.size
    workspace.display = display
    workspace.isActive = true
    
    this.log(`Linux workspace ${workspace.name} assigned to display :${display}`)
  }

  private async createMacOSWorkspace(workspace: GhostWorkspace): Promise<void> {
    // macOS workspace management through Spaces
    workspace.isActive = true
    this.log(`macOS workspace ${workspace.name} created`)
  }

  async switchToWorkspace(workspaceId: string): Promise<void> {
    const workspace = this.workspaces.get(workspaceId)
    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceId}`)
    }

    // Deactivate current workspace
    if (this.activeWorkspace) {
      this.activeWorkspace.isActive = false
    }

    // Activate new workspace
    await this.activateWorkspace(workspace)
    this.activeWorkspace = workspace
    workspace.lastUsed = new Date()

    this.emit('workspace_switched', workspace)
    this.log(`Switched to workspace: ${workspace.name}`)
  }

  private async activateWorkspace(workspace: GhostWorkspace): Promise<void> {
    switch (workspace.platform) {
      case 'windows':
        await this.activateWindowsWorkspace(workspace)
        break
      case 'linux':
        await this.activateLinuxWorkspace(workspace)
        break
      case 'macos':
        await this.activateMacOSWorkspace(workspace)
        break
    }
  }

  private async activateWindowsWorkspace(workspace: GhostWorkspace): Promise<void> {
    const script = `
      Add-Type -AssemblyName System.Windows.Forms
      $desktop = [System.Windows.Forms.Desktop]::GetDesktop("${workspace.name}")
      if ($desktop) {
        [System.Windows.Forms.Desktop]::SetCurrentDesktop($desktop)
        Write-Output "SUCCESS: Activated ${workspace.name}"
      }
    `

    await this.runPowerShell(script)
    workspace.isActive = true
  }

  private async activateLinuxWorkspace(workspace: GhostWorkspace): Promise<void> {
    if (workspace.display !== undefined) {
      process.env.DISPLAY = `:${workspace.display}`
      workspace.isActive = true
    }
  }

  private async activateMacOSWorkspace(workspace: GhostWorkspace): Promise<void> {
    // macOS space switching
    workspace.isActive = true
  }

  // HUMANIZATION AND ANTI-BOT

  async applyJitter(action: any): Promise<any> {
    if (!this.config.jitter.enabled) return action

    const jittered = { ...action }

    if (this.config.jitter.mouseJitter && action.type === 'mouse') {
      jittered.coordinates = this.applyMouseJitter(action.coordinates)
    }

    if (this.config.jitter.typingJitter && action.type === 'typing') {
      jittered.delays = this.applyTypingJitter(action.text || '')
    }

    if (this.config.jitter.gaussianDelay) {
      jittered.delay = this.applyGaussianDelay()
    }

    return jittered
  }

  private applyMouseJitter(coordinates: { x: number; y: number }): { x: number; y: number } {
    const jitter = 2 * this.config.jitter.humanizationLevel
    return {
      x: coordinates.x + (Math.random() - 0.5) * jitter,
      y: coordinates.y + (Math.random() - 0.5) * jitter
    }
  }

  private applyTypingJitter(text: string): number[] {
    const baseDelay = 100
    const delays: number[] = []
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      let delay = baseDelay
      
      // Add variance based on humanization level
      const variance = baseDelay * this.config.jitter.variance * this.config.jitter.humanizationLevel
      delay += (Math.random() - 0.5) * variance
      
      // Add extra delay for special characters
      if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(char)) {
        delay *= 1.5
      }
      
      // Add pause after punctuation
      if (/[.!?]/.test(char)) {
        delay *= 2
      }
      
      delays.push(Math.max(this.config.jitter.minDelay, Math.min(this.config.jitter.maxDelay, delay)))
    }
    
    return delays
  }

  private applyGaussianDelay(): number {
    // Box-Muller transform for Gaussian distribution
    const u1 = Math.random()
    const u2 = Math.random()
    const gaussian = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    
    const mean = (this.config.jitter.minDelay + this.config.jitter.maxDelay) / 2
    const stdDev = (this.config.jitter.maxDelay - this.config.jitter.minDelay) / 6
    
    const delay = mean + gaussian * stdDev * this.config.jitter.humanizationLevel
    return Math.max(this.config.jitter.minDelay, Math.min(this.config.jitter.maxDelay, delay))
  }

  async applyAntiBotMeasures(action: any): Promise<any> {
    if (!this.config.antiBot.enabled) return action

    const protected = { ...action }

    if (this.config.antiBot.randomDelays) {
      protected.randomDelay = Math.random() * 1000
    }

    if (this.config.antiBot.mouseSpeedVariation && action.type === 'mouse') {
      protected.mouseSpeed = 0.5 + Math.random() * 1.5
    }

    if (this.config.antiBot.clickPatterns && action.type === 'click') {
      protected.clickPattern = this.generateClickPattern()
    }

    if (this.config.antiBot.typingRhythm && action.type === 'typing') {
      protected.typingRhythm = this.generateTypingRhythm()
    }

    return protected
  }

  private generateClickPattern(): string {
    const patterns = ['single', 'double', 'triple', 'hold']
    return patterns[Math.floor(Math.random() * patterns.length)]
  }

  private generateTypingRhythm(): number[] {
    const rhythms = [
      [100, 150, 100, 200, 100], // Normal rhythm
      [80, 120, 80, 160, 80],    // Fast rhythm  
      [150, 200, 150, 250, 150], // Slow rhythm
      [100, 100, 200, 100, 300]  // Variable rhythm
    ]
    return rhythms[Math.floor(Math.random() * rhythms.length)]
  }

  // EXECUTION METHODS

  async executeAction(action: any): Promise<any> {
    // Apply anti-bot measures
    const protectedAction = await this.applyAntiBotMeasures(action)
    
    // Apply humanization jitter
    const jitteredAction = await this.applyJitter(protectedAction)

    // Ensure we're in the right workspace
    if (this.activeWorkspace) {
      await this.switchToWorkspace(this.activeWorkspace.id)
    }

    // Execute the action
    const result = await this.performAction(jitteredAction)

    // Log for audit
    if (this.config.security.auditLogging) {
      this.auditLog.push(JSON.stringify({
        timestamp: new Date().toISOString(),
        action: jitteredAction,
        result: result.success ? 'success' : 'failed',
        workspace: this.activeWorkspace?.name
      }))
    }

    return result
  }

  private async performAction(action: any): Promise<any> {
    switch (action.type) {
      case 'mouse':
        return await this.performMouseAction(action)
      case 'keyboard':
        return await this.performKeyboardAction(action)
      case 'typing':
        return await this.performTypingAction(action)
      case 'click':
        return await this.performClickAction(action)
      case 'screenshot':
        return await this.performScreenshotAction(action)
      case 'window':
        return await this.performWindowAction(action)
      default:
        throw new Error(`Unknown action type: ${action.type}`)
    }
  }

  private async performMouseAction(action: any): Promise<any> {
    const platform = this.getPlatform()
    
    switch (platform) {
      case 'windows':
        return await this.performWindowsMouseAction(action)
      case 'linux':
        return await this.performLinuxMouseAction(action)
      case 'macos':
        return await this.performMacOSMouseAction(action)
      default:
        throw new Error(`Mouse actions not supported on ${platform}`)
    }
  }

  private async performWindowsMouseAction(action: any): Promise<any> {
    const { x, y, mouseSpeed = 1.0, bezierCurves = true } = action
    
    if (bezierCurves && this.config.jitter.bezierCurves) {
      await this.moveMouseBezier(x, y, mouseSpeed)
    } else {
      await this.moveMouseLinear(x, y, mouseSpeed)
    }

    return { success: true, coordinates: { x, y } }
  }

  private async moveMouseBezier(targetX: number, targetY: number, speed: number): Promise<void> {
    // Get current mouse position
    const currentPos = await this.getCurrentMousePosition()
    const startX = currentPos.x
    const startY = currentPos.y

    // Generate Bezier curve control points
    const controlX1 = startX + (targetX - startX) * 0.3 + (Math.random() - 0.5) * 50
    const controlY1 = startY + (targetY - startY) * 0.3 + (Math.random() - 0.5) * 50
    const controlX2 = startX + (targetX - startX) * 0.7 + (Math.random() - 0.5) * 50
    const controlY2 = startY + (targetY - startY) * 0.7 + (Math.random() - 0.5) * 50

    const steps = 50
    const duration = 1000 / speed

    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      
      // Cubic Bezier formula
      const x = Math.pow(1 - t, 3) * startX +
                3 * Math.pow(1 - t, 2) * t * controlX1 +
                3 * (1 - t) * Math.pow(t, 2) * controlX2 +
                Math.pow(t, 3) * targetX
                
      const y = Math.pow(1 - t, 3) * startY +
                3 * Math.pow(1 - t, 2) * t * controlY1 +
                3 * (1 - t) * Math.pow(t, 2) * controlY2 +
                Math.pow(t, 3) * targetY

      await this.setMousePosition(Math.round(x), Math.round(y))
      await new Promise(resolve => setTimeout(resolve, duration / steps))
    }
  }

  private async moveMouseLinear(targetX: number, targetY: number, speed: number): Promise<void> {
    const currentPos = await this.getCurrentMousePosition()
    const startX = currentPos.x
    const startY = currentPos.y
    
    const distance = Math.sqrt(Math.pow(targetX - startX, 2) + Math.pow(targetY - startY, 2))
    const duration = distance / (100 * speed)
    const steps = Math.min(50, Math.max(10, distance / 10))

    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const x = startX + (targetX - startX) * t
      const y = startY + (targetY - startY) * t
      
      await this.setMousePosition(Math.round(x), Math.round(y))
      await new Promise(resolve => setTimeout(resolve, duration / steps))
    }
  }

  private async getCurrentMousePosition(): Promise<{ x: number; y: number }> {
    const script = `
      Add-Type -TypeDefinition '
        using System;
        using System.Runtime.InteropServices;
        public class Mouse {
          [DllImport("user32.dll")]
          public static extern bool GetCursorPos(out POINT lpPoint);
          
          [StructLayout(LayoutKind.Sequential)]
          public struct POINT {
            public int X;
            public int Y;
          }
        }
      '
      
      $point = New-Object Mouse+POINT
      [Mouse]::GetCursorPos([ref]$point)
      Write-Output "$($point.X),$($point.Y)"
    `

    const result = await this.runPowerShell(script)
    const [x, y] = result.stdout.trim().split(',').map(Number)
    return { x, y }
  }

  private async setMousePosition(x: number, y: number): Promise<void> {
    const script = `
      Add-Type -TypeDefinition '
        using System;
        using System.Runtime.InteropServices;
        public class Mouse {
          [DllImport("user32.dll")]
          public static extern void SetCursorPos(int x, int y);
        }
      '
      
      [Mouse]::SetCursorPos(${x}, ${y})
    `

    await this.runPowerShell(script)
  }

  private async performKeyboardAction(action: any): Promise<any> {
    const { key, modifiers = [] } = action
    
    const script = `
      Add-Type -AssemblyName System.Windows.Forms
      
      $modifiers = @()
      ${modifiers.map((mod: string) => `
        if ("${mod}" -eq "ctrl") { $modifiers += [System.Windows.Forms.Keys]::Control }
        if ("${mod}" -eq "shift") { $modifiers += [System.Windows.Forms.Keys]::Shift }
        if ("${mod}" -eq "alt") { $modifiers += [System.Windows.Forms.Keys]::Alt }
      `).join('\n')}
      
      $key = [System.Windows.Forms.Keys]::"${key.toUpperCase()}"
      [System.Windows.Forms.SendKeys]::SendWait("{$key}")
    `

    await this.runPowerShell(script)
    return { success: true, key, modifiers }
  }

  private async performTypingAction(action: any): Promise<any> {
    const { text, delays = [] } = action
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      const delay = delays[i] || 100
      
      await this.typeCharacter(char)
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    return { success: true, text: text.length }
  }

  private async typeCharacter(char: string): Promise<void> {
    const script = `
      Add-Type -AssemblyName System.Windows.Forms
      [System.Windows.Forms.SendKeys]::SendWait("${char}")
    `

    await this.runPowerShell(script)
  }

  private async performClickAction(action: any): Promise<any> {
    const { button = 'left', clickPattern = 'single' } = action
    
    const script = `
      Add-Type -TypeDefinition '
        using System;
        using System.Runtime.InteropServices;
        public class Mouse {
          [DllImport("user32.dll")]
          public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, UIntPtr dwExtraInfo);
          
          private const uint MOUSEEVENTF_LEFTDOWN = 0x02;
          private const uint MOUSEEVENTF_LEFTUP = 0x04;
          private const uint MOUSEEVENTF_RIGHTDOWN = 0x08;
          private const uint MOUSEEVENTF_RIGHTUP = 0x10;
          private const uint MOUSEEVENTF_MIDDLEDOWN = 0x20;
          private const uint MOUSEEVENTF_MIDDLEUP = 0x40;
        }
      '
      
      $button = "${button}"
      $pattern = "${clickPattern}"
      
      switch ($button) {
        "left" {
          $down = [Mouse]::MOUSEEVENTF_LEFTDOWN
          $up = [Mouse]::MOUSEEVENTF_LEFTUP
        }
        "right" {
          $down = [Mouse]::MOUSEEVENTF_RIGHTDOWN
          $up = [Mouse]::MOUSEEVENTF_RIGHTUP
        }
        "middle" {
          $down = [Mouse]::MOUSEEVENTF_MIDDLEDOWN
          $up = [Mouse]::MOUSEEVENTF_MIDDLEUP
        }
      }
      
      switch ($pattern) {
        "single" {
          [Mouse]::mouse_event($down, 0, 0, 0, [UIntPtr]::Zero)
          Start-Sleep -Milliseconds 50
          [Mouse]::mouse_event($up, 0, 0, 0, [UIntPtr]::Zero)
        }
        "double" {
          [Mouse]::mouse_event($down, 0, 0, 0, [UIntPtr]::Zero)
          Start-Sleep -Milliseconds 50
          [Mouse]::mouse_event($up, 0, 0, 0, [UIntPtr]::Zero)
          Start-Sleep -Milliseconds 100
          [Mouse]::mouse_event($down, 0, 0, 0, [UIntPtr]::Zero)
          Start-Sleep -Milliseconds 50
          [Mouse]::mouse_event($up, 0, 0, 0, [UIntPtr]::Zero)
        }
        "triple" {
          for ($i = 1; $i -le 3; $i++) {
            [Mouse]::mouse_event($down, 0, 0, 0, [UIntPtr]::Zero)
            Start-Sleep -Milliseconds 50
            [Mouse]::mouse_event($up, 0, 0, 0, [UIntPtr]::Zero)
            Start-Sleep -Milliseconds 100
          }
        }
        "hold" {
          [Mouse]::mouse_event($down, 0, 0, 0, [UIntPtr]::Zero)
          Start-Sleep -Milliseconds 500
          [Mouse]::mouse_event($up, 0, 0, 0, [UIntPtr]::Zero)
        }
      }
    `

    await this.runPowerShell(script)
    return { success: true, button, clickPattern }
  }

  private async performScreenshotAction(action: any): Promise<any> {
    const { region, format = 'png', quality = 80 } = action
    
    const timestamp = Date.now()
    const filename = `screenshot_${timestamp}.${format}`
    const filepath = path.join(os.tmpdir(), filename)

    const script = `
      Add-Type -AssemblyName System.Drawing
      Add-Type -AssemblyName System.Windows.Forms
      
      ${region ? `
        $bitmap = New-Object System.Drawing.Bitmap(${region.width}, ${region.height})
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        $graphics.CopyFromScreen(${region.x}, ${region.y}, 0, 0, $bitmap.Size)
      ` : `
        $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
        $bitmap = New-Object System.Drawing.Bitmap($bounds.Width, $bounds.Height)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bitmap.Size)
      `}
      
      $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/${format}" }
      $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
      $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, ${quality}L)
      
      $bitmap.Save("${filepath}", $codec, $encoderParams)
      $graphics.Dispose()
      $bitmap.Dispose()
    `

    await this.runPowerShell(script)
    return { success: true, filepath, filename }
  }

  private async performWindowAction(action: any): Promise<any> {
    const { operation, windowTitle, parameters = {} } = action
    
    switch (operation) {
      case 'find':
        return await this.findWindow(windowTitle)
      case 'activate':
        return await this.activateWindow(windowTitle)
      case 'close':
        return await this.closeWindow(windowTitle)
      case 'minimize':
        return await this.minimizeWindow(windowTitle)
      case 'maximize':
        return await this.maximizeWindow(windowTitle)
      case 'resize':
        return await this.resizeWindow(windowTitle, parameters.width, parameters.height)
      case 'move':
        return await this.moveWindow(windowTitle, parameters.x, parameters.y)
      default:
        throw new Error(`Unknown window operation: ${operation}`)
    }
  }

  private async findWindow(windowTitle: string): Promise<any> {
    const script = `
      Add-Type -AssemblyName UIAutomationClient
      $root = [System.Windows.Automation.AutomationElement]::RootElement
      $cond = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, "${windowTitle}")
      $window = $root.FindFirst([System.Windows.Automation.TreeScope]::Children, $cond)
      
      if ($window) {
        $bounds = $window.Current.BoundingRectangle
        Write-Output "FOUND:$($bounds.X),$($bounds.Y),$($bounds.Width),$($bounds.Height)"
      } else {
        Write-Output "NOT_FOUND"
      }
    `

    const result = await this.runPowerShell(script)
    if (result.stdout.startsWith('FOUND:')) {
      const [, x, y, width, height] = result.stdout.split(':').pop().split(',').map(Number)
      return { found: true, bounds: { x, y, width, height } }
    } else {
      return { found: false }
    }
  }

  private async activateWindow(windowTitle: string): Promise<any> {
    const script = `
      Add-Type -AssemblyName UIAutomationClient
      $root = [System.Windows.Automation.AutomationElement]::RootElement
      $cond = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, "${windowTitle}")
      $window = $root.FindFirst([System.Windows.Automation.TreeScope]::Children, $cond)
      
      if ($window) {
        $window.SetFocus()
        Write-Output "SUCCESS"
      } else {
        Write-Output "NOT_FOUND"
      }
    `

    const result = await this.runPowerShell(script)
    return { success: result.stdout.includes('SUCCESS') }
  }

  // Linux and macOS implementations would go here...

  // UTILITY METHODS

  private async checkCommandExists(command: string): Promise<boolean> {
    return new Promise((resolve) => {
      exec(`which ${command}`, (error) => {
        resolve(!error)
      })
    })
  }

  private async runPowerShell(script: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve, reject) => {
      const child = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script], { windowsHide: true })
      let stdout = ''
      let stderr = ''

      child.stdout?.on('data', (data) => { stdout += data.toString() })
      child.stderr?.on('data', (data) => { stderr += data.toString() })
      child.on('close', (code) => {
        resolve({ stdout, stderr, exitCode: code || 0 })
      })
      child.on('error', reject)
    })
  }

  private async runAppleScript(script: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn('osascript', ['-e', script])
      let stdout = ''
      let stderr = ''

      child.stdout?.on('data', (data) => { stdout += data.toString() })
      child.stderr?.on('data', (data) => { stderr += data.toString() })
      child.on('close', (code) => {
        if (code === 0) {
          resolve(stdout.trim())
        } else {
          reject(new Error(`AppleScript failed: ${stderr}`))
        }
      })
      child.on('error', reject)
    })
  }

  private initializeCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.performCleanup()
    }, this.config.performance.cleanupInterval)
  }

  private async performCleanup(): Promise<void> {
    // Clean up inactive workspaces
    const now = new Date()
    const inactiveWorkspaces = Array.from(this.workspaces.values())
      .filter(workspace => !workspace.isActive && (now.getTime() - workspace.lastUsed.getTime()) > 300000) // 5 minutes

    for (const workspace of inactiveWorkspaces) {
      await this.destroyWorkspace(workspace.id)
    }

    // Trim audit log
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-500)
    }
  }

  private async destroyWorkspace(workspaceId: string): Promise<void> {
    const workspace = this.workspaces.get(workspaceId)
    if (!workspace) return

    // Platform-specific cleanup
    switch (workspace.platform) {
      case 'windows':
        await this.destroyWindowsWorkspace(workspace)
        break
      case 'linux':
        await this.destroyLinuxWorkspace(workspace)
        break
      case 'macos':
        await this.destroyMacOSWorkspace(workspace)
        break
    }

    this.workspaces.delete(workspaceId)
    this.emit('workspace_destroyed', workspace)
    this.log(`Workspace destroyed: ${workspace.name}`)
  }

  private async destroyWindowsWorkspace(workspace: GhostWorkspace): Promise<void> {
    // Windows-specific cleanup
    if (workspace.desktopName) {
      const script = `
        Add-Type -AssemblyName System.Windows.Forms
        # Switch back to default desktop
        $defaultDesktop = [System.Windows.Forms.Desktop]::GetDesktop("Default")
        if ($defaultDesktop) {
          [System.Windows.Forms.Desktop]::SetCurrentDesktop($defaultDesktop)
        }
      `
      await this.runPowerShell(script)
    }
  }

  private async destroyLinuxWorkspace(workspace: GhostWorkspace): Promise<void> {
    // Linux-specific cleanup
    if (workspace.processId) {
      process.kill(workspace.processId)
    }
  }

  private async destroyMacOSWorkspace(workspace: GhostWorkspace): Promise<void> {
    // macOS-specific cleanup
  }

  private log(message: string): void {
    const logEntry = `[${new Date().toISOString()}] ${message}`
    console.log(logEntry)
    if (this.config.security.auditLogging) {
      this.auditLog.push(logEntry)
    }
  }

  // PUBLIC API

  getWorkspaces(): GhostWorkspace[] {
    return Array.from(this.workspaces.values())
  }

  getActiveWorkspace(): GhostWorkspace | null {
    return this.activeWorkspace
  }

  getAuditLog(): string[] {
    return [...this.auditLog]
  }

  async shutdown(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }

    // Destroy all workspaces
    const workspaceIds = Array.from(this.workspaces.keys())
    for (const workspaceId of workspaceIds) {
      await this.destroyWorkspace(workspaceId)
    }

    this.isInitialized = false
    this.emit('shutdown')
    this.log('GhostHand Manager shut down')
  }
}

export default GhostHandManager
