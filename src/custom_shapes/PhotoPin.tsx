import {
	Geometry2d,
	HTMLContainer,
	RecordProps,
	Rectangle2d,
	ShapeUtil,
	T,
	TLBaseShape,
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
		return (
			<HTMLContainer>
				<div
					className="photo-pin"
					style={{
						width: shape.props.w,
						height: shape.props.h,
					}}
				>
					<div className="photo-pin-top"></div>
					<div className="photo-pin-image-container">
						<img 
							src={shape.props.imageUrl} 
							alt={shape.props.caption || 'Photo'}
							className="photo-pin-image"
						/>
					</div>
					{shape.props.caption && (
						<div className="photo-pin-caption">{shape.props.caption}</div>
					)}
				</div>
			</HTMLContainer>
		)
	}

	override indicator(shape: IPhotoPin) {
		return <rect width={shape.props.w} height={shape.props.h} />
	}
}
