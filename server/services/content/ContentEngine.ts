import { WindowsUIAutomationAdapter } from '../agents/WindowsUIAutomationAgent'
import { ghostWorkspaceManager } from '../automation/GhostWorkspaceManager'
import { runPowerShell } from '../automation/PowerShellRunner'
import { generateWithMistral } from '../ai/mistral/MistralClient'
import { captureScreenshot } from '../automation/ScreenshotCapture'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'

export interface ContentRequest {
  type: 'presentation' | 'document' | 'spreadsheet' | 'email'
  prompt: string
  style?: 'professional' | 'creative' | 'minimal' | 'bold'
  length?: 'short' | 'medium' | 'long'
  targetApp?: 'powerpoint' | 'word' | 'excel' | 'gmail' | 'outlook'
  template?: string
  images?: boolean
  brandColors?: string[]
}

export interface ContentSection {
  title: string
  content: string
  speakerNotes?: string
  visualHints?: string[]
}

export interface GeneratedContent {
  title: string
  sections: ContentSection[]
  summary: string
  estimatedTime: number
  visualElements: string[]
}

export class ContentEngine {
  private uiAgent: WindowsUIAutomationAdapter

  constructor() {
    this.uiAgent = new WindowsUIAutomationAdapter()
  }

  async generateOutline(request: ContentRequest): Promise<GeneratedContent> {
    const systemPrompt = `You are an expert content strategist and presentation designer. 
Generate a detailed outline for a ${request.type} based on the user's prompt.
Focus on clarity, impact, and visual storytelling.
Return structured JSON with title, sections, and visual element suggestions.`

    const userPrompt = `Create a ${request.type} outline for: "${request.prompt}"
Style: ${request.style || 'professional'}
Length: ${request.length || 'medium'}
Target app: ${request.targetApp || 'powerpoint'}
Include images: ${request.images || false}`

    try {
      const response = await generateWithMistral(systemPrompt, userPrompt, {
        temperature: 0.7,
        maxTokens: 2000
      })

      // Parse the response and structure it
      const content = this.parseMistralResponse(response)
      return content
    } catch (error) {
      console.error('Failed to generate outline:', error)
      throw new Error('Content generation failed')
    }
  }

  async createPowerPoint(request: ContentRequest): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      // 1. Generate the content outline
      const content = await this.generateOutline(request)

      // 2. Launch PowerPoint on hidden desktop
      const powerpointPath = this.findPowerPointPath()
      if (!powerpointPath) {
        return { success: false, error: 'PowerPoint not found' }
      }

      const launchResult = await ghostWorkspaceManager.launchOnHiddenDesktop({
        path: powerpointPath,
        args: [],
        desktopName: 'JASON_Workspace'
      })

      if (!launchResult.ok) {
        return { success: false, error: launchResult.error }
      }

      // 3. Wait for PowerPoint to initialize
      await new Promise(resolve => setTimeout(resolve, 3000))

      // 4. Create the presentation using VLM-guided automation
      await this.automatePowerPointCreation(content, request)

      // 5. Save the presentation
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jason-content-'))
      const fileName = `${this.sanitizeFileName(content.title)}.pptx`
      const filePath = path.join(tempDir, fileName)

      await this.savePowerPoint(filePath)

      return { success: true, filePath }
    } catch (error) {
      console.error('PowerPoint creation failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async createWordDocument(request: ContentRequest): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      // 1. Generate the content outline
      const content = await this.generateOutline(request)

      // 2. Launch Word on hidden desktop
      const wordPath = this.findWordPath()
      if (!wordPath) {
        return { success: false, error: 'Word not found' }
      }

      const launchResult = await ghostWorkspaceManager.launchOnHiddenDesktop({
        path: wordPath,
        args: [],
        desktopName: 'JASON_Workspace'
      })

      if (!launchResult.ok) {
        return { success: false, error: launchResult.error }
      }

      // 3. Wait for Word to initialize
      await new Promise(resolve => setTimeout(resolve, 3000))

      // 4. Create the document using VLM-guided automation
      await this.automateWordCreation(content, request)

      // 5. Save the document
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jason-content-'))
      const fileName = `${this.sanitizeFileName(content.title)}.docx`
      const filePath = path.join(tempDir, fileName)

      await this.saveWordDocument(filePath)

      return { success: true, filePath }
    } catch (error) {
      console.error('Word document creation failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  private async automatePowerPointCreation(content: GeneratedContent, request: ContentRequest): Promise<void> {
    // Create new presentation
    await this.uiAgent.vlmSemanticClick({
      desktopName: 'JASON_Workspace',
      targetText: 'New Presentation',
      timeoutMs: 5000
    })

    // Add title slide
    await this.addTitleSlide(content.title)

    // Add content slides
    for (const section of content.sections) {
      await this.addContentSlide(section, request.style || 'professional')
    }

    // Apply formatting and visuals
    if (request.images) {
      await this.addVisualElements(content.visualElements)
    }

    if (request.brandColors && request.brandColors.length > 0) {
      await this.applyBrandColors(request.brandColors)
    }
  }

  private async automateWordCreation(content: GeneratedContent, request: ContentRequest): Promise<void> {
    // Start with title
    await this.uiAgent.vlmSemanticClick({
      desktopName: 'JASON_Workspace',
      targetText: 'Blank Document',
      timeoutMs: 5000
    })

    // Type title
    await this.uiAgent.vlmSemanticClick({
      desktopName: 'JASON_Workspace',
      targetText: 'Type here',
      timeoutMs: 3000
    })

    await this.typeText(content.title + '\n\n')

    // Add sections
    for (const section of content.sections) {
      await this.typeText(`## ${section.title}\n\n`)
      await this.typeText(section.content + '\n\n')
    }

    // Apply formatting
    await this.applyWordFormatting(request.style || 'professional')
  }

  private async addTitleSlide(title: string): Promise<void> {
    // Click on title placeholder
    await this.uiAgent.vlmSemanticClick({
      desktopName: 'JASON_Workspace',
      targetText: 'Click to add title',
      timeoutMs: 3000
    })

    // Type the title
    await this.typeText(title)
  }

  private async addContentSlide(section: ContentSection, style: string): Promise<void> {
    // Add new slide
    await this.uiAgent.vlmSemanticClick({
      desktopName: 'JASON_Workspace',
      targetText: 'New Slide',
      timeoutMs: 3000
    })

    // Click on title placeholder
    await this.uiAgent.vlmSemanticClick({
      desktopName: 'JASON_Workspace',
      targetText: 'Click to add title',
      timeoutMs: 3000
    })

    // Type section title
    await this.typeText(section.title)

    // Click on content placeholder
    await this.uiAgent.vlmSemanticClick({
      desktopName: 'JASON_Workspace',
      targetText: 'Click to add text',
      timeoutMs: 3000
    })

    // Type content
    await this.typeText(section.content)
  }

  private async typeText(text: string): Promise<void> {
    // Use Windows UI automation to type text
    const script = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class Keyboard {
  [DllImport("user32.dll")]
  public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, uint dwExtraInfo);
}
"@
$text = @'
${text.replace(/'/g, "''")}'
@
foreach ($char in $text.ToCharArray()) {
  $vk = [System.Windows.Input.KeyInterop]VirtualKeyFromChar($char)
  [Keyboard]::keybd_event([byte]$vk, 0, 0, 0)
  Start-Sleep -Milliseconds 50
  [Keyboard]::keybd_event([byte]$vk, 0, 2, 0)
  Start-Sleep -Milliseconds 30
}
`

    await runPowerShell(script, 30000)
  }

  private async savePowerPoint(filePath: string): Promise<void> {
    // Use keyboard shortcuts to save
    const script = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class Keyboard {
  [DllImport("user32.dll")]
  public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, uint dwExtraInfo);
}
"@
# Press Ctrl+S to save
[Keyboard]::keybd_event(17, 0, 0, 0)  # Ctrl down
[Keyboard]::keybd_event(83, 0, 0, 0)  # S down
Start-Sleep -Milliseconds 100
[Keyboard]::keybd_event(83, 0, 2, 0)  # S up
[Keyboard]::keybd_event(17, 0, 2, 0)  # Ctrl up
Start-Sleep -Milliseconds 500

# Type file path
$shell = New-Object -ComObject WScript.Shell
$shell.AppActivate("PowerPoint")
Start-Sleep -Milliseconds 500
$shell.SendKeys("${filePath.replace(/\\/g, '\\\\')}")
Start-Sleep -Milliseconds 500
$shell.SendKeys("{ENTER}")
`

    await runPowerShell(script, 10000)
  }

  private async saveWordDocument(filePath: string): Promise<void> {
    // Similar to PowerPoint save but for Word
    const script = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class Keyboard {
  [DllImport("user32.dll")]
  public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, uint dwExtraInfo);
}
"@
# Press Ctrl+S to save
[Keyboard]::keybd_event(17, 0, 0, 0)  # Ctrl down
[Keyboard]::keybd_event(83, 0, 0, 0)  # S down
Start-Sleep -Milliseconds 100
[Keyboard]::keybd_event(83, 0, 2, 0)  # S up
[Keyboard]::keybd_event(17, 0, 2, 0)  # Ctrl up
Start-Sleep -Milliseconds 500

# Type file path
$shell = New-Object -ComObject WScript.Shell
$shell.AppActivate("Word")
Start-Sleep -Milliseconds 500
$shell.SendKeys("${filePath.replace(/\\/g, '\\\\')}")
Start-Sleep -Milliseconds 500
$shell.SendKeys("{ENTER}")
`

    await runPowerShell(script, 10000)
  }

  private parseMistralResponse(response: string): GeneratedContent {
    // Parse the Mistral response and structure it
    // This is a simplified parser - in production, you'd want more robust parsing
    try {
      const parsed = JSON.parse(response)
      return {
        title: parsed.title || 'Untitled',
        sections: parsed.sections || [],
        summary: parsed.summary || '',
        estimatedTime: parsed.estimatedTime || 0,
        visualElements: parsed.visualElements || []
      }
    } catch {
      // Fallback parsing
      return {
        title: 'Generated Content',
        sections: [
          {
            title: 'Introduction',
            content: response.substring(0, 500)
          }
        ],
        summary: response.substring(0, 100),
        estimatedTime: 5,
        visualElements: []
      }
    }
  }

  private findPowerPointPath(): string | null {
    const commonPaths = [
      'C:\\Program Files\\Microsoft Office\\root\\Office16\\POWERPNT.EXE',
      'C:\\Program Files (x86)\\Microsoft Office\\root\\Office16\\POWERPNT.EXE',
      'C:\\Program Files\\Microsoft Office\\Office16\\POWERPNT.EXE',
      'C:\\Program Files (x86)\\Microsoft Office\\Office16\\POWERPNT.EXE'
    ]

    // In a real implementation, you'd check if these paths exist
    return commonPaths[0] // Return first path for now
  }

  private findWordPath(): string | null {
    const commonPaths = [
      'C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE',
      'C:\\Program Files (x86)\\Microsoft Office\\root\\Office16\\WINWORD.EXE',
      'C:\\Program Files\\Microsoft Office\\Office16\\WINWORD.EXE',
      'C:\\Program Files (x86)\\Microsoft Office\\Office16\\WINWORD.EXE'
    ]

    return commonPaths[0] // Return first path for now
  }

  private sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
  }

  private async addVisualElements(visualElements: string[]): Promise<void> {
    // Implementation for adding images, charts, etc.
    // This would use VLM to find and click on appropriate UI elements
  }

  private async applyBrandColors(colors: string[]): Promise<void> {
    // Implementation for applying brand colors
    // This would use VLM to find color selection tools
  }

  private async applyWordFormatting(style: string): Promise<void> {
    // Implementation for applying Word formatting based on style
    // This would use VLM to find formatting tools
  }
}

export const contentEngine = new ContentEngine()
