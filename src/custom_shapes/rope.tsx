import { StateNode, TLArrowShape } from 'tldraw'
import { RopeShape } from './rope_shape'
import 'tldraw/tldraw.css'

const OFFSET = 12

export class RopeTool extends StateNode {
	static override id = 'rope'

	// [a]
	override onEnter() {
		this.editor.setCursor({ type: 'cross', rotation: 0 })
	}

	// [b]
	override onPointerDown() {
		console.log("ROPE POINTER DOWN")
		const { currentPagePoint } = this.editor.inputs
		this.editor.createShape<RopeShape>({
			start: { x: currentPagePoint.x, y: currentPagePoint.y+10 },
			end: { x: currentPagePoint.x, y: currentPagePoint.y+10 },
		})
	}
	private complete() {
		this.parent.transition('select', {})
	}
}
