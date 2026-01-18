import { StateNode } from 'tldraw'

// There's a guide at the bottom of this file!

export class ScreenshotIdle extends StateNode {
	static override id = 'idle'

	// [1]
	override onPointerDown() {
		this.parent.transition('pointing')
	}
}