import {
	Geometry2d,
	HTMLContainer,
	RecordProps,
	Rectangle2d,
	ShapeUtil,
	T,
	TLBaseShape,
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
		return (
			<HTMLContainer>
				<div
					className="profile-card"
					style={{
						width: shape.props.w,
						height: shape.props.h,
					}}
				>
					<div className="profile-card-pin"></div>
					<div className="profile-card-content">
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

	override indicator(shape: IProfileCard) {
		return null
	}
}
