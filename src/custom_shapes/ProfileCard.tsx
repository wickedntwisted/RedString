import type { ChangeEvent, DragEvent } from 'react'
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

type IProfileCard = TLBaseShape<
	'profile-card',
	{
		w: number
		h: number
		name: string
		title: string
		company: string
		linkedinUrl: string
		imageUrl: string
		email?: string
		location?: string
	}
>

export class ProfileCardUtil extends ShapeUtil<IProfileCard> {
	static override type = 'profile-card' as const
	
	static override props: RecordProps<IProfileCard> = {
		w: T.number,
		h: T.number,
		name: T.string,
		title: T.string,
		company: T.string,
		linkedinUrl: T.string,
		imageUrl: T.string,
		email: T.string.optional(),
		location: T.string.optional(),
	}

	getDefaultProps(): IProfileCard['props'] {
		return {
			w: 280,
			h: 200,
			name: 'John Doe',
			title: 'Software Engineer',
			company: 'Tech Corp',
			linkedinUrl: 'https://linkedin.com/in/johndoe',
			imageUrl: '',
			email: '',
			location: '',
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

	getGeometry(shape: IProfileCard): Geometry2d {
		return new Rectangle2d({
			width: shape.props.w,
			height: shape.props.h,
			isFilled: true,
		})
	}

	override component(shape: IProfileCard) {
		const editor = useEditor()

		const updateImage = (imageUrl: string) => {
			editor.updateShape({
				id: shape.id,
				type: 'profile-card',
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

		const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0]
			if (file && file.type.startsWith('image/')) {
				const reader = new FileReader()
				reader.onload = () => {
					const result = typeof reader.result === 'string' ? reader.result : ''
					if (result) {
						updateImage(result)
					}
				}
				reader.readAsDataURL(file)
			}
			event.target.value = ''
		}

		return (
			<HTMLContainer>
				<div
					className="profile-card"
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
					<div className="profile-card-pin"></div>
					<div className="profile-card-content">
						<label
							className="profile-card-upload"
							onPointerDown={(event) => event.stopPropagation()}
							onClick={(event) => event.stopPropagation()}
							style={{ pointerEvents: 'auto' }}
						>
							<input
								type="file"
								accept="image/*"
								onChange={handleFileSelect}
								style={{ display: 'none' }}
							/>
							Upload photo
						</label>
						{shape.props.imageUrl && (
							<img 
								src={shape.props.imageUrl} 
								alt={shape.props.name}
								className="profile-card-image"
							/>
						)}
						<div className="profile-card-info">
							<h3 className="profile-card-name">{shape.props.name}</h3>
							<p className="profile-card-title">{shape.props.title}</p>
							<p className="profile-card-company">{shape.props.company}</p>
							{shape.props.location && (
								<p className="profile-card-location">📍 {shape.props.location}</p>
							)}
							{shape.props.email && (
								<p className="profile-card-email">✉️ {shape.props.email}</p>
							)}
							<a 
								href={shape.props.linkedinUrl} 
								target="_blank" 
								rel="noopener noreferrer"
								className="profile-card-link"
								onClick={(e) => e.stopPropagation()}
							>
								🔗 LinkedIn Profile
							</a>
						</div>
					</div>
				</div>
			</HTMLContainer>
		)
	}

	override indicator(_shape: IProfileCard) {
		return null
	}
}
