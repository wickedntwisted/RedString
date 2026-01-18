import { StateNode, TLTextShape, Tldraw, toRichText } from 'tldraw'
import 'tldraw/tldraw.css'

const OFFSET = 12

export class StickerTool extends StateNode {
	static override id = 'sticker'

	// [a]
	override onEnter() {
		this.editor.setCursor({ type: 'cross', rotation: 0 })
	}

	// [b]
	override onPointerDown() {
		const { currentPagePoint } = this.editor.inputs
		this.editor.createShape<TLTextShape>({
			type: 'text',
			x: currentPagePoint.x - OFFSET,
			y: currentPagePoint.y - OFFSET,
			props: { richText: toRichText('❤️') },
		})
	}
}
