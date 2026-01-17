import { TLArrowShape,
	HTMLContainer,
	RecordProps,
	ShapeUtil,
	T,
	TLBaseShape,
	TLResizeInfo,
} from 'tldraw'

type IRopeShape = {
	start : { x: number, y: number },
	end : { x: number, y: number }
}

export class RopeShape extends ShapeUtil<TLArrowShape> {
    static override type = 'rope_shape' as const
	static override props: RecordProps<IRopeShape> = {
		start: T.number,
		end: T.number,
	}

	getDefaultProps(): IRopeShape['props'] {
		return {
			start: {x:0, y:0},
			end: {x:100, y:100},
		}
	}

	indicator(shape: IRopeShape) {
		return <rect width={shape.props.start.x + shape.props.end.x} height={shape.props.start.y + shape.props.end.y} />
	}

}
