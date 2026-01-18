import {
	Geometry2d,
	HTMLContainer,
	RecordProps,
	Rectangle2d,
	ShapeUtil,
	T,
	TLBaseShape,
} from 'tldraw'

type IRopeShape = TLBaseShape<
	'rope',
	{
		w: number
		h: number
		thickness?: number
		confirmed?: boolean
		fromShapeId?: string
		toShapeId?: string
	}
>

export class RopeUtil extends ShapeUtil<IRopeShape> {
	static override type = 'rope' as const
	
	static override props: RecordProps<IRopeShape> = {
		w: T.number,
		h: T.number,
		thickness: T.number.optional(),
		confirmed: T.boolean.optional(),
		fromShapeId: T.string.optional(),
		toShapeId: T.string.optional(),
	}

	getDefaultProps(): IRopeShape['props'] {
		return {
			w: 200,
			h: 3,
			thickness: 3,
			confirmed: false,
		}
	}

	override canEdit() {
		return false
	}

	override canResize() {
		return false
	}

	override isAspectRatioLocked() {
		return false
	}

	override hideSelectionBoundsBg() {
		return true
	}

	override hideRotateHandle() {
		return true
	}

	override hideResizeHandles() {
		return true
	}

	getGeometry(shape: IRopeShape): Geometry2d {
		return new Rectangle2d({
			width: shape.props.w,
			height: shape.props.h || shape.props.thickness || 3,
			isFilled: true,
		})
	}

	override component(shape: IRopeShape) {
		const thickness = shape.props.thickness || 3
		const confirmed = shape.props.confirmed ?? false
		const opacity = confirmed ? 1 : 0.4
		const redColor = '#dc2626' // Red string color
		
		return (
			<HTMLContainer>
				<div
					className="rope-shape"
					style={{
						width: shape.props.w,
						height: thickness,
						position: 'relative',
						transformOrigin: 'left center', // Rotate from the left edge (start point)
						pointerEvents: 'none',
					}}
					onPointerDown={(e) => {
						// Only prevent selection if buttons are visible (not confirmed)
						if (!confirmed) {
							e.stopPropagation()
						}
					}}
				>
					{/* Red string with subtle texture */}
					<div
						className="rope-string"
						style={{
							position: 'absolute',
							width: 'calc(100% - 12px)', // Leave space for arrowhead
							height: '100%',
							left: 0,
							top: 0,
							backgroundColor: redColor,
							boxShadow: confirmed
								? '0 0 2px rgba(220, 38, 38, 0.5)'
								: '0 0 1px rgba(220, 38, 38, 0.3)',
							borderRadius: '2px',
							opacity,
							transition: 'opacity 0.3s ease',
							pointerEvents: confirmed ? 'auto' : 'none',
						}}
					/>
					{/* Subtle highlight for depth */}
					<div
						className="rope-highlight"
						style={{
							position: 'absolute',
							width: 'calc(100% - 12px)',
							height: '30%',
							top: 0,
							left: 0,
							background: `linear-gradient(
								180deg,
								rgba(255, 255, 255, 0.2) 0%,
								transparent 100%
							)`,
							pointerEvents: 'none',
							opacity,
							transition: 'opacity 0.3s ease',
						}}
					/>
				</div>
			</HTMLContainer>
		)
	}

	override indicator(shape: IRopeShape) {
		return null
	}
}
