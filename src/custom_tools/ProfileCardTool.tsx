import { 
    StateNode,
    TLTextShape,
    Tldraw,
    toRichText
} from 'tldraw'
import 'tldraw/tldraw.css'
import { ProfileCardUtil } from '../custom_shapes/ProfileCard'

const OFFSET = 12

export class ProfileCardTool extends StateNode {
	static override id = 'profile_card'

	override onEnter() {
        console.log("ENTERED")
		this.editor.setCursor({ type: 'cross', rotation: 0 })
	}

	override onPointerDown() {
		const { currentPagePoint } = this.editor.inputs
		this.editor.createShape<ProfileCardUtil>({
			type: 'profile-card',
			x: currentPagePoint.x - OFFSET,
			y: currentPagePoint.y - OFFSET,
		})
	}
}
