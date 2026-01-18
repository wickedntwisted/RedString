import {
	Geometry2d,
	HTMLContainer,
	RecordProps,
	Rectangle2d,
	ShapeUtil,
	T,
	TLBaseShape,
} from 'tldraw'

type INoteCard = TLBaseShape<
	'note-card',
	{
		w: number
		h: number
		text: string
		color?: string
	}
>

export class NoteCardUtil extends ShapeUtil<INoteCard> {
	static override type = 'note-card' as const
	
	static override props: RecordProps<INoteCard> = {
		w: T.number,
		h: T.number,
		text: T.string,
		color: T.string.optional(),
	}

	getDefaultProps(): INoteCard['props'] {
		return {
			w: 180,
			h: 180,
			text: 'Note',
			color: '#ffeb3b',
		}
	}

	override canEdit() {
		return false
	}
	
	override canResize() {
		return true
	}

	override isAspectRatioLocked() {
		return false
	}

	getGeometry(shape: INoteCard): Geometry2d {
		return new Rectangle2d({
			width: shape.props.w,
			height: shape.props.h,
			isFilled: true,
		})
	}

	override component(shape: INoteCard) {
		return (
			<HTMLContainer>
				<div
					className="note-card"
					style={{
						width: shape.props.w,
						height: shape.props.h,
						backgroundColor: shape.props.color || '#ffeb3b',
					}}
				>
					<div className="note-card-pin"></div>
					<div className="note-card-content">
						{shape.props.text.split('\n').map((line, i) => (
							<p key={i} className="note-card-line">{line}</p>
						))}
					</div>
				</div>
			</HTMLContainer>
		)
	}

	override indicator(shape: INoteCard) {
		return <rect width={shape.props.w} height={shape.props.h} />
	}
}
