import {
	Geometry2d,
	HTMLContainer,
	RecordProps,
	Rectangle2d,
	ShapeUtil,
	T,
	TLBaseShape,
	TLResizeInfo,
	Tldraw,
	resizeBox,
} from 'tldraw'
import 'tldraw/tldraw.css'

type ICustomShape = TLBaseShape<
	'my-custom-shape',
	{
		w: number
		h: number
		text: string
	}
>

export class MyShapeUtil extends ShapeUtil<ICustomShape> {
    static override type = 'my-custom-shape' as const
	static override props: RecordProps<ICustomShape> = {
		w: T.number,
		h: T.number,
		text: T.string,
	}

    getDefaultProps(): ICustomShape['props'] {
		return {
			w: 200,
			h: 200,
			text: "I'm a shape!",
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

    getGeometry(shape: ICustomShape): Geometry2d {
		return new Rectangle2d({
			width: shape.props.w,
			height: shape.props.h,
			isFilled: true,
		})
	}
}