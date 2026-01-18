import { StateNode, TLShapeId, createShapeId } from 'tldraw'
import 'tldraw/tldraw.css'


export class RopeTool extends StateNode {
	static override id = 'rope'

	startPagePoint = {x : 0, y : 0}
	ropeId: TLShapeId | undefined = undefined

	override onEnter() {
		this.editor.setCursor({ type: 'cross', rotation: 0 })
		this.startPagePoint = {x : 0, y : 0}
		this.ropeId = undefined
	}

	override onPointerDown() {
		// Copy the current page point so it does not reference the point object directly
		const { x, y } = this.editor.inputs.currentPagePoint
		this.startPagePoint = { x, y }
		console.log("startPagePoint:", this.startPagePoint)
		this.ropeId = createShapeId();		
		this.editor.createShape({
			id: this.ropeId,
			type: 'rope_shape',
			x: this.startPagePoint.x,
			y: this.startPagePoint.y,
			props: {
				start: { x: 0, y: 0 },
				end: { x: 1, y: 1 },
			},
		})
	}
	
	override onPointerMove() {
		if (!this.ropeId) return 
		const currentpoint = this.editor.inputs.currentPagePoint
		console.log("current point: ", currentpoint, " - starting point: ", this.startPagePoint)
		this.editor.updateShape({
			id: this.ropeId,
			type: 'rope_shape',
			props: {
				end: { 
					x: Math.abs(currentpoint.x - this.startPagePoint.x) , 
					y: Math.abs(currentpoint.y - this.startPagePoint.y) 
				},
			},
		})
	}
	override onPointerUp() {
		this.ropeId = undefined;
	}
}