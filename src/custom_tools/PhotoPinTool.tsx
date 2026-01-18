import { 
    StateNode,
    TLTextShape,
    Tldraw,
    toRichText
} from 'tldraw'
import 'tldraw/tldraw.css'
import { PhotoPinUtil } from '../custom_shapes/PhotoPin'

const OFFSET = 12

export class PhotoPinTool extends StateNode {
	static override id = 'photo_pin'

	override onEnter() {
        console.log("ENTERED")
		this.editor.setCursor({ type: 'cross', rotation: 0 })
	}

	override onPointerDown() {
		const { currentPagePoint } = this.editor.inputs
		this.editor.createShape<PhotoPinTool>({
			type: 'photo-pin',
			x: currentPagePoint.x - OFFSET,
			y: currentPagePoint.y - OFFSET,
		})
	}
}
