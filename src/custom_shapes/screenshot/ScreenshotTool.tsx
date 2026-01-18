import { StateNode } from 'tldraw'
import { ScreenshotDragging } from './Dragging'
import { ScreenshotIdle } from './Idle.tsx'
import { ScreenshotPointing } from './Pointing'

// There's a guide at the bottom of this file!

export class ScreenshotTool extends StateNode {
	// [1]
	static override id = 'screenshot'
	static override initial = 'idle'
	static override children() {
		return [ScreenshotIdle, ScreenshotPointing, ScreenshotDragging]
	}

	// [2]
	override onEnter() {
		this.editor.setCursor({ type: 'cross', rotation: 0 })
	}

	override onExit() {
		this.editor.setCursor({ type: 'default', rotation: 0 })
	}

	// [3]
	override onInterrupt() {
		this.complete()
	}

	override onCancel() {
		this.complete()
	}

	private complete() {
		this.parent.transition('select', {})
	}
}