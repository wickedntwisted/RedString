import { 
    StateNode,
    Tldraw,
} from 'tldraw'
import 'tldraw/tldraw.css'
import { NoteCardUtil } from '../custom_shapes/NoteCard'

const OFFSET = 12

export class NoteCardTool extends StateNode {
	static override id = 'note_card'

	override onEnter() {
        console.log("ENTERED")
		this.editor.setCursor({ type: 'cross', rotation: 0 })
	}

	override onPointerDown() {
		const { currentPagePoint } = this.editor.inputs
		this.editor.createShape<NoteCardUtil>({
			type: 'note-card',
			x: currentPagePoint.x - OFFSET,
			y: currentPagePoint.y - OFFSET,
		})
	}
}
