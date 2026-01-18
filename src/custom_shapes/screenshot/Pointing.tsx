import { StateNode } from 'tldraw'

// There's a guide at the bottom of this file!

export class ScreenshotPointing extends StateNode {
	static override id = 'pointing'

	// [1]
	override onPointerMove() {
		if (this.editor.inputs.isDragging) {
			this.parent.transition('dragging')
		}
	}

	// [2]
	override onPointerUp() {
		this.complete()
	}

	override onCancel() {
		this.complete()
	}

	private complete() {
		this.parent.transition('idle')
	}
}