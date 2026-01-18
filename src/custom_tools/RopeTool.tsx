import { 
    StateNode,
    TLTextShape,
    Tldraw,
    createShapeId,
    toRichText
} from 'tldraw'
import 'tldraw/tldraw.css'
import { RopeUtil } from '../custom_shapes/Rope'

const OFFSET = 12

export class RopeTool extends StateNode {
	static override id = 'rope_tool'
	current_rope_id = undefined

	override onEnter() {
        console.log("ENTERED")
		this.editor.setCursor({ type: 'cross', rotation: 0 })
	}

	override onPointerDown() {
		const { currentPagePoint } = this.editor.inputs
		// Find the first hittable shape beneath the pointer
		const hitShape = this.editor.getShapeAtPoint(currentPagePoint)
		const hitShapeId = hitShape ? hitShape.id : undefined
		if (hitShapeId){
			console.log("HIT SHAPE:", hitShapeId)
			if (this.current_rope_id){
				this.editor.updateShape({
					id : this.current_rope_id,
					toShapeId: hitShapeId,
				})
				this.current_rope_id = undefined
			}
			else{
				this.current_rope_id = createShapeId();
				this.editor.createShape({
					id : this.current_rope_id,
					type: 'rope',
					x: currentPagePoint.x - OFFSET,
					y: currentPagePoint.y - OFFSET,
					fromShapeId: hitShapeId, 
				})
			}
		}
	}
	
	override onPointerMove() {
	
	}
}
