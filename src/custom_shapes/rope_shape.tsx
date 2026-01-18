import {

	HTMLContainer,
	Rectangle2d,
	RecordProps,
	ShapeUtil,
	T,
	TLBaseShape as AnyShape,
} from 'tldraw'

type IRopeShape = AnyShape<
	'rope_shape',
	{
		start: {x : number, y : number},
		end: {x: number, y: number}
	}
>


export class RopeShape extends ShapeUtil<IRopeShape> {
    static override type = 'rope_shape' as const
	static override props: RecordProps<IRopeShape> = {
		start: T.object({
			x: T.number,
			y: T.number,
		}),
		end: T.object({
			x: T.number,
			y: T.number,
		}),
	}

	getDefaultProps(): IRopeShape['props'] {
		return {
			start: {x:0, y:0},
			end: {x:100, y:100},
		}
	}
	
	
	getGeometry(shape: IRopeShape) {
		return new Rectangle2d({
			width: Math.abs(shape.props.end.x - shape.props.start.x),
			height: Math.abs(shape.props.end.y - shape.props.start.y),
			isFilled: true,
		})
	}

	indicator(shape: IRopeShape) {
		return <rect width={Math.abs(shape.props.end.x - shape.props.start.x)} height={Math.abs(shape.props.end.y - shape.props.start.y)} />
	}

	component(shape: IRopeShape) {
		const width = Math.abs(shape.props.end.x - shape.props.start.x);
		const height = Math.abs(shape.props.end.y - shape.props.start.y);

		return (
			<HTMLContainer>
				<svg width={width} height={height}>
					<line
						x1="0"
						y1="0"
						x2={width}
						y2={height}
						stroke="black"
						strokeWidth="2"
					/>
				</svg>
			</HTMLContainer>
		);
	}

}
