 import React from "react"; 
  
export const custom_tools = React.useMemo(() => {
    if (!editor) return {};
    const toolsArray = [
      {
        id: "select",
        label: "tool.select",
        icon: "tool-pointer",
        kbd: "v",
        readonlyOk: true,
        onSelect(source) {
          if (editor.isIn("select")) {
            const currentNode = editor.root.getCurrent();
            currentNode.exit({}, currentNode.id);
            currentNode.enter({}, currentNode.id);
          }
          editor.setCurrentTool("select");
          onToolSelect(source, this);
        }
      },
      {
        id: "hand",
        label: "tool.hand",
        icon: "tool-hand",
        kbd: "h",
        readonlyOk: true,
        onSelect(source) {
          editor.setCurrentTool("hand");
          onToolSelect(source, this);
        }
      },
      {
        id: "eraser",
        label: "tool.eraser",
        icon: "tool-eraser",
        kbd: "e",
        onSelect(source) {
          editor.setCurrentTool("eraser");
          onToolSelect(source, this);
        }
      },
      {
        id: "draw",
        label: "tool.draw",
        icon: "tool-pencil",
        kbd: "d,b,x",
        onSelect(source) {
          editor.setCurrentTool("draw");
          onToolSelect(source, this);
        }
      },
      ...[...import_editor.GeoShapeGeoStyle.values].map((geo) => ({
        id: geo,
        label: `tool.${geo}`,
        meta: {
          geo
        },
        kbd: geo === "rectangle" ? "r" : geo === "ellipse" ? "o" : void 0,
        icon: "geo-" + geo,
        onSelect(source) {
          editor.run(() => {
            editor.setStyleForNextShapes(import_editor.GeoShapeGeoStyle, geo);
            editor.setCurrentTool("geo");
            onToolSelect(source, this, `geo-${geo}`);
          });
        },
        onDragStart(source, info) {
          onDragFromToolbarToCreateShape(editor, info, {
            createShape: (id) => editor.createShape({ id, type: "geo", props: { w: 200, h: 200, geo } })
          });
          trackEvent("drag-tool", { source, id: "geo" });
        }
      })),
      {
        id: "arrow",
        label: "tool.arrow",
        icon: "tool-arrow",
        kbd: "a",
        onSelect(source) {
          editor.setCurrentTool("arrow");
          onToolSelect(source, this);
        },
        onDragStart(source, info) {
          onDragFromToolbarToCreateShape(editor, info, {
            createShape: (id) => editor.createShape({
              id,
              type: "arrow",
              props: { start: { x: 0, y: 200 }, end: { x: 200, y: 0 } }
            })
          });
          trackEvent("drag-tool", { source, id: "arrow" });
        }
      },
      {
        id: "line",
        label: "tool.line",
        icon: "tool-line",
        kbd: "l",
        onSelect(source) {
          editor.setCurrentTool("line");
          onToolSelect(source, this);
        },
        onDragStart(source, info) {
          onDragFromToolbarToCreateShape(editor, info, {
            createShape: (id) => {
              const [start, end] = (0, import_editor.getIndicesBetween)(null, null, 2);
              editor.createShape({
                id,
                type: "line",
                props: {
                  points: {
                    [start]: { id: start, index: start, x: 0, y: 200 },
                    [end]: { id: end, index: end, x: 200, y: 0 }
                  }
                }
              });
            }
          });
          trackEvent("drag-tool", { source, id: "line" });
        }
      },
      {
        id: "frame",
        label: "tool.frame",
        icon: "tool-frame",
        kbd: "f",
        onSelect(source) {
          editor.setCurrentTool("frame");
          onToolSelect(source, this);
        },
        onDragStart(source, info) {
          onDragFromToolbarToCreateShape(editor, info, {
            createShape: (id) => editor.createShape({ id, type: "frame" })
          });
          trackEvent("drag-tool", { source, id: "frame" });
        }
      },
      {
        id: "text",
        label: "tool.text",
        icon: "tool-text",
        kbd: "t",
        onSelect(source) {
          editor.setCurrentTool("text");
          onToolSelect(source, this);
        },
        onDragStart(source, info) {
          onDragFromToolbarToCreateShape(editor, info, {
            createShape: (id) => editor.createShape({ id, type: "text", props: { richText: (0, import_editor.toRichText)("Text") } }),
            onDragEnd: (id) => {
              editor.setEditingShape(id);
              editor.emit("select-all-text", { shapeId: id });
            }
          });
          trackEvent("drag-tool", { source, id: "text" });
        }
      },
      {
        id: "asset",
        label: "tool.media",
        icon: "tool-media",
        kbd: "cmd+u,ctrl+u",
        onSelect(source) {
          helpers.insertMedia();
          onToolSelect(source, this, "media");
        }
      },
      {
        id: "note",
        label: "tool.note",
        icon: "tool-note",
        kbd: "n",
        onSelect(source) {
          editor.setCurrentTool("note");
          onToolSelect(source, this);
        },
        onDragStart(source, info) {
          onDragFromToolbarToCreateShape(editor, info, {
            createShape: (id) => editor.createShape({ id, type: "note" }),
            onDragEnd: (id) => {
              editor.setEditingShape(id);
              editor.emit("select-all-text", { shapeId: id });
            }
          });
          trackEvent("drag-tool", { source, id: "note" });
        }
      },
      {
        id: "laser",
        label: "tool.laser",
        readonlyOk: true,
        icon: "tool-laser",
        kbd: "k",
        onSelect(source) {
          editor.setCurrentTool("laser");
          onToolSelect(source, this);
        }
      },
      {
        id: "embed",
        label: "tool.embed",
        icon: "dot",
        onSelect(source) {
          helpers.addDialog({ component: import_EmbedDialog.EmbedDialog });
          onToolSelect(source, this);
        }
      },
      {
        id: "highlight",
        label: "tool.highlight",
        icon: "tool-highlight",
        // TODO: pick a better shortcut
        kbd: "shift+d",
        onSelect(source) {
          editor.setCurrentTool("highlight");
          onToolSelect(source, this);
        }
      }
    ];
    toolsArray.forEach((t) => t.onSelect = t.onSelect.bind(t));
    const tools2 = Object.fromEntries(toolsArray.map((t) => [t.id, t]));
    if (overrides) {
      return overrides(editor, tools2, helpers);
    }
    return tools2;
  }, [overrides, editor, helpers, onToolSelect, trackEvent]);
