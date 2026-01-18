import type { DragEvent } from 'react'
import {
	Geometry2d,
	HTMLContainer,
	RecordProps,
	Rectangle2d,
	ShapeUtil,
	T,
	TLBaseShape,
	useEditor,
} from 'tldraw'

type IPhotoPin = TLBaseShape<
	'photo-pin',
	{
		w: number
		h: number
		imageUrl: string
		caption?: string
	}
>

export class PhotoPinUtil extends ShapeUtil<IPhotoPin> {
	static override type = 'photo-pin' as const
	
	static override props: RecordProps<IPhotoPin> = {
		w: T.number,
		h: T.number,
		imageUrl: T.string,
		caption: T.string.optional(),
	}

	getDefaultProps(): IPhotoPin['props'] {
		return {
			w: 200,
			h: 200,
			imageUrl: '',
			caption: '',
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

	getGeometry(shape: IPhotoPin): Geometry2d {
		return new Rectangle2d({
			width: shape.props.w,
			height: shape.props.h,
			isFilled: true,
		})
	}

	override component(shape: IPhotoPin) {
		const editor = useEditor()

		const updateImage = (imageUrl: string) => {
			editor.updateShape({
				id: shape.id,
				type: 'photo-pin',
				props: {
					imageUrl,
				},
			})
		}

		const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
			event.preventDefault()
			event.stopPropagation()

			const { files } = event.dataTransfer
			if (files && files.length > 0) {
				const file = Array.from(files).find((item) => item.type.startsWith('image/'))
				if (file) {
					const reader = new FileReader()
					reader.onload = () => {
						const result = typeof reader.result === 'string' ? reader.result : ''
						if (result) {
							updateImage(result)
						}
					}
					reader.readAsDataURL(file)
				}
				return
			}

			const uriList = event.dataTransfer.getData('text/uri-list').trim()
			const plainText = event.dataTransfer.getData('text/plain').trim()
			const candidate = uriList || plainText

			if (candidate.startsWith('data:image/')) {
				updateImage(candidate)
				return
			}

			try {
				const url = new URL(candidate)
				const hasImageExt = /\.(png|jpe?g|gif|webp|svg)$/i.test(url.pathname)
				if (hasImageExt) {
					updateImage(url.toString())
				}
			} catch {
				// ignore non-url drops
			}
		}

		return (
			<HTMLContainer>
				<div
					className="photo-pin"
					style={{
						width: shape.props.w,
						height: shape.props.h,
					}}
					onDragOver={(event) => {
						event.preventDefault()
						event.stopPropagation()
					}}
					onDrop={handleDrop}
				>
					<div className="photo-pin-top"></div>
					<div className="photo-pin-image-container">
						{shape.props.imageUrl && (
							<img 
								src={shape.props.imageUrl} 
								alt={shape.props.caption || 'Photo'}
								className="photo-pin-image"
							/>
						)}
					</div>
					{shape.props.caption && (
						<div className="photo-pin-caption">{shape.props.caption}</div>
					)}
				</div>
			</HTMLContainer>
		)
	}

	override indicator(_shape: IPhotoPin) {
		return null
	}
}
