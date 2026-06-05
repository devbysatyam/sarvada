"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import { useCallback, useEffect } from "react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  icon,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  icon: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded transition-all ${
        active
          ? "bg-primary text-on-primary shadow-sm"
          : "text-on-surface-variant hover:bg-surface-container hover:text-primary"
      } ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span className="material-symbols-outlined text-[18px] leading-none block">
        {icon}
      </span>
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-6 bg-surface-variant mx-1" />;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  minHeight = "200px",
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: "max-w-full h-auto rounded my-4",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline hover:text-secondary",
        },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder,
      }),
      Highlight.configure({
        multicolor: false,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none font-body-sm text-on-surface leading-relaxed p-5",
        style: `min-height: ${minHeight}`,
      },
    },
  });

  // Sync external content changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  const addImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Enter the image URL:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const addLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL:", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="border border-surface-variant bg-surface-container-lowest overflow-hidden focus-within:border-primary transition-colors">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 bg-surface-container border-b border-surface-variant">
        {/* Text Type Dropdown */}
        <select
          value={
            editor.isActive("heading", { level: 2 })
              ? "h2"
              : editor.isActive("heading", { level: 3 })
              ? "h3"
              : editor.isActive("heading", { level: 4 })
              ? "h4"
              : "p"
          }
          onChange={(e) => {
            const val = e.target.value;
            if (val === "p") {
              editor.chain().focus().setParagraph().run();
            } else {
              const level = parseInt(val.replace("h", "")) as 2 | 3 | 4;
              editor.chain().focus().toggleHeading({ level }).run();
            }
          }}
          className="px-2 py-1.5 bg-surface-container-lowest border border-surface-variant text-xs font-label-caps uppercase tracking-wider outline-none focus:border-primary mr-2 appearance-none cursor-pointer"
          title="Text Style"
        >
          <option value="p">Paragraph</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
        </select>

        <ToolbarDivider />

        {/* Formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold (Ctrl+B)"
          icon="format_bold"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic (Ctrl+I)"
          icon="format_italic"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          title="Underline (Ctrl+U)"
          icon="format_underlined"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          title="Strikethrough"
          icon="strikethrough_s"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          active={editor.isActive("highlight")}
          title="Highlight"
          icon="ink_highlighter"
        />

        <ToolbarDivider />

        {/* Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          active={editor.isActive({ textAlign: "left" })}
          title="Align Left"
          icon="format_align_left"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          active={editor.isActive({ textAlign: "center" })}
          title="Align Center"
          icon="format_align_center"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          active={editor.isActive({ textAlign: "right" })}
          title="Align Right"
          icon="format_align_right"
        />

        <ToolbarDivider />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet List"
          icon="format_list_bulleted"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Numbered List"
          icon="format_list_numbered"
        />

        <ToolbarDivider />

        {/* Block */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="Quote"
          icon="format_quote"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")}
          title="Code Block"
          icon="code"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
          icon="horizontal_rule"
        />

        <ToolbarDivider />

        {/* Media */}
        <ToolbarButton onClick={addImage} title="Insert Image" icon="image" />
        <ToolbarButton
          onClick={addLink}
          active={editor.isActive("link")}
          title="Insert Link"
          icon="link"
        />

        <ToolbarDivider />

        {/* History */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
          icon="undo"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Y)"
          icon="redo"
        />
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface-container border-t border-surface-variant">
        <div className="flex items-center gap-4">
          <span className="font-label-caps text-[9px] text-on-surface-variant/50 uppercase tracking-widest">
            {editor.storage.characterCount?.characters?.() ??
              editor.getText().length}{" "}
            chars
          </span>
          <span className="font-label-caps text-[9px] text-on-surface-variant/50 uppercase tracking-widest">
            {editor.storage.characterCount?.words?.() ??
              editor
                .getText()
                .split(/\s+/)
                .filter((w: string) => w).length}{" "}
            words
          </span>
        </div>
        <span className="font-label-caps text-[9px] text-on-surface-variant/30 uppercase tracking-widest">
          Rich Editor
        </span>
      </div>
    </div>
  );
}
