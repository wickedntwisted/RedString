    import { 
      Tldraw, 
      toRichText, 
      TLTextShape, 
      Box,
    	DefaultToolbar,
    	DefaultToolbarContent,
    	TLComponents,
    	TLUiAssetUrlOverrides,
    	TLUiOverrides,
    	TldrawUiMenuItem,
    	useEditor,
    	useIsToolSelected,
    	useTools,
    	useValue 
    } from 'tldraw'
    import 'tldraw/tldraw.css'
    import "../board.css"
    import { MyShapeUtil } from '../custom_shapes/textbox'
    import { StickerTool } from '../custom_shapes/sticker'
    import { RopeTool } from '../custom_shapes/rope'
    import { RopeShape } from '../custom_shapes/rope_shape'
    import { ScreenshotTool } from '../custom_shapes/screenshot/ScreenshotTool.tsx'
    import { ScreenshotDragging } from '../custom_shapes/screenshot/Dragging'
    
    const customTool = [RopeTool]
    const customShape = [MyShapeUtil, RopeShape]
    
const customUiOverrides: TLUiOverrides = {
	tools: (editor : any, tools : any) => {
		return {
			...tools,
			rope: {
				id: 'rope',
				label: 'Rope',
				icon: 'tool-rope',
				kbd: 'r',
				onSelect() {
					editor.setCurrentTool('rope')
				},
			},
		}
	},
}

function CustomToolbar() {
	const tools = useTools()
	const isRopeSelected = useIsToolSelected(tools['rope'])
	return (
		<DefaultToolbar>
			<TldrawUiMenuItem {...tools['rope']} isSelected={isRopeSelected} />
			<DefaultToolbarContent />
		</DefaultToolbar>
	)
}

const customAssetUrls: TLUiAssetUrlOverrides = {
	icons: {
		'tool-rope': '/tool-screenshot.svg',
	},
}

const customComponents: TLComponents = {
	Toolbar: CustomToolbar,
}


export function DetectiveBoard() {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader()
        reader.onload = (event) => {
          const imageUrl = event.target?.result as string
          console.log('File dropped:', file.name)
        }
        reader.readAsDataURL(file)
      })
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{ position: 'fixed', inset: 0 }}
    >
      <Tldraw 
      shapeUtils={customShape}
      tools={customTool}
      overrides={customUiOverrides}
      assetUrls={customAssetUrls}
      components={customComponents}
      onMount={(editor) => {
        editor.createShape<TLTextShape>({
          type: 'text',
          x: 100,
          y: 100,
          props: { richText: toRichText('Add any node to start the search!') },
        })

        editor.sideEffects.registerAfterCreateHandler('shape', (shape) => {
          console.log("NEW SHAPE:", shape.id)
          if (shape.type == 'rope_shape'){
            
          }

          console.log(shape)
        })
      }}
      >
        </Tldraw> /
    </div>
  )
}