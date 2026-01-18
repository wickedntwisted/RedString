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
	'temporal_rope',
	{
		w: number
		h: number
		thickness?: number
		confirmed?: boolean
		fromShapeId?: string
		toShapeId?: string
	}
>

export class TemporalRopeUtil extends ShapeUtil<IRopeShape> {
	static override type = 'temporal_rope' as const
	
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
					{/* Arrowhead at the end */}
					<div
						className="rope-arrowhead"
						style={{
							position: 'absolute',
							right: 0,
							top: '50%',
							transform: 'translateY(-50%)',
							width: 0,
							height: 0,
							borderLeft: `8px solid ${redColor}`,
							borderTop: '6px solid transparent',
							borderBottom: '6px solid transparent',
							filter: confirmed
								? 'drop-shadow(0 0 2px rgba(220, 38, 38, 0.5))'
								: 'drop-shadow(0 0 1px rgba(220, 38, 38, 0.3))',
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
					{/* Confirmation buttons - only show when not confirmed */}
					{!confirmed && (
						<div 
							className="rope-confirmation-buttons"
							style={{
								position: 'absolute',
								top: '50%',
								left: '50%',
								transform: 'translate(-50%, -50%)',
								display: 'flex',
								gap: '8px',
								zIndex: 1000,
								pointerEvents: 'auto',
							}}
							onPointerDown={(e) => {
								e.stopPropagation()
								e.nativeEvent.stopPropagation()
							}}
							onClick={(e) => {
								e.stopPropagation()
								e.nativeEvent.stopPropagation()
							}}
							onMouseDown={(e) => {
								e.stopPropagation()
							}}
						>
							<button
								className="rope-confirm-btn"
								type="button"
								onPointerDown={(e) => {
									e.stopPropagation()
									e.nativeEvent?.stopPropagation()
									e.nativeEvent?.stopImmediatePropagation()
									// Dispatch in next frame to avoid tldraw selection
									requestAnimationFrame(() => {
										window.dispatchEvent(new CustomEvent('rope-confirm', {
											detail: { shapeId: shape.id },
										}))
									})
								}}
								onClick={(e) => {
									e.stopPropagation()
									e.preventDefault()
									e.nativeEvent?.stopPropagation()
									e.nativeEvent?.stopImmediatePropagation()
								}}
								style={{
									background: '#10b981',
									color: 'white',
									border: 'none',
									borderRadius: '4px',
									padding: '4px 8px',
									fontSize: '11px',
									fontWeight: 'bold',
									cursor: 'pointer',
									boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
									pointerEvents: 'auto',
									userSelect: 'none',
								}}
							>
								✓
							</button>
							<button
								className="rope-discard-btn"
								type="button"
								onPointerDown={(e) => {
									e.stopPropagation()
									e.nativeEvent?.stopPropagation()
									e.nativeEvent?.stopImmediatePropagation()
									// Dispatch in next frame to avoid tldraw selection
									requestAnimationFrame(() => {
										window.dispatchEvent(new CustomEvent('rope-discard', {
											detail: { shapeId: shape.id },
										}))
									})
								}}
								onClick={(e) => {
									e.stopPropagation()
									e.preventDefault()
									e.nativeEvent?.stopPropagation()
									e.nativeEvent?.stopImmediatePropagation()
								}}
								style={{
									background: '#ef4444',
									color: 'white',
									border: 'none',
									borderRadius: '4px',
									padding: '4px 8px',
									fontSize: '11px',
									fontWeight: 'bold',
									cursor: 'pointer',
									boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
									pointerEvents: 'auto',
									userSelect: 'none',
								}}
							>
								✕
							</button>
						</div>
					)}
				</div>
			</HTMLContainer>
		)
	}

	override indicator(shape: IRopeShape) {
		return null
	}
}
