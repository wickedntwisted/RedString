import type { ChangeEvent } from 'react'
import {
	Geometry2d,
	HTMLContainer,
	RecordProps,
	Rectangle2d,
	ShapeUtil,
	T,
	TLBaseShape,
	useEditor,
	useValue,
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

const NoteCardComponent = ({ shape }: { shape: INoteCard }) => {
	const editor = useEditor()
	const isEditing = useValue(
		'isEditing',
		() => editor.getEditingShapeId() === shape.id,
		[editor, shape.id]
	)

	const startEditing = () => {
		if (editor.getEditingShapeId() !== shape.id) {
			editor.setEditingShape(shape.id)
		}
	}

	const stopEditing = () => {
		if (editor.getEditingShapeId() === shape.id) {
			editor.setEditingShape(null)
		}
	}

	const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
		editor.updateShape({
			id: shape.id,
			type: 'note-card',
			props: {
				text: event.target.value,
			},
		})
	}

	return (
		<HTMLContainer>
			<div
				className="note-card"
				style={{
					width: shape.props.w,
					height: shape.props.h,
					backgroundColor: shape.props.color || '#ffeb3b',
				}}
				onDoubleClick={(event) => {
					event.stopPropagation()
					startEditing()
				}}
			>
				<div className="note-card-pin"></div>
				<div className="note-card-content">
					{isEditing ? (
						<textarea
							autoFocus
							value={shape.props.text}
							onChange={handleChange}
							onBlur={stopEditing}
							onKeyDown={(event) => {
								if (event.key === 'Escape') {
									event.stopPropagation()
									stopEditing()
								}
							}}
							onPointerDown={(event) => event.stopPropagation()}
							spellCheck={false}
							style={{
								width: '100%',
								height: '100%',
								border: 'none',
								outline: 'none',
								resize: 'none',
								background: 'transparent',
								font: 'inherit',
								color: 'inherit',
								lineHeight: '1.4',
							}}
						/>
					) : (
						shape.props.text.split('\n').map((line, i) => (
							<p key={i} className="note-card-line">{line}</p>
						))
					)}
				</div>
			</div>
		</HTMLContainer>
	)
}

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
		return true
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

	override getText(shape: INoteCard) {
		return shape.props.text
	}

	override component(shape: INoteCard) {
		return <NoteCardComponent shape={shape} />
	}

	override indicator(_shape: INoteCard) {
		return null
	}
}
