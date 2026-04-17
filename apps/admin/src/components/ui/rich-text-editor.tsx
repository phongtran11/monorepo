'use client';

import { cn } from '@admin/lib/utils';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Underline as UnderlineIcon,
} from 'lucide-react';
import { useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive: boolean;
  disabled: boolean;
  title: string;
  children: React.ReactNode;
}

interface ToolbarItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  isActive: boolean;
  disabled: boolean;
}

function ToolbarButton({
  onClick,
  isActive,
  disabled,
  title,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault(); // prevent editor losing focus on toolbar click
        onClick();
      }}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={isActive}
      className={cn(
        'rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50',
        isActive && 'bg-accent text-foreground',
      )}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Nhập nội dung...',
  disabled = false,
  invalid = false,
  id,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        code: false,
        blockquote: false,
        strike: false,
        horizontalRule: false,
      }),
      Underline,
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.isEmpty ? '' : editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'outline-none min-h-[140px] px-2.5 py-2 text-sm',
        ...(id ? { id } : {}),
      },
    },
    immediatelyRender: false,
  });

  const toolbarItems: ToolbarItem[] = [
    {
      label: 'Bold',
      icon: <Bold className="size-3.5" />,
      onClick: () => editor?.chain().focus().toggleBold().run(),
      isActive: editor?.isActive('bold') ?? false,
      disabled: disabled || !editor?.can().toggleBold(),
    },
    {
      label: 'Italic',
      icon: <Italic className="size-3.5" />,
      onClick: () => editor?.chain().focus().toggleItalic().run(),
      isActive: editor?.isActive('italic') ?? false,
      disabled: disabled || !editor?.can().toggleItalic(),
    },
    {
      label: 'Underline',
      icon: <UnderlineIcon className="size-3.5" />,
      onClick: () => editor?.chain().focus().toggleUnderline().run(),
      isActive: editor?.isActive('underline') ?? false,
      disabled: disabled || !editor?.can().toggleUnderline(),
    },
    {
      label: 'Heading 2',
      icon: <Heading2 className="size-3.5" />,
      onClick: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor?.isActive('heading', { level: 2 }) ?? false,
      disabled: disabled || !editor?.can().toggleHeading({ level: 2 }),
    },
    {
      label: 'Heading 3',
      icon: <Heading3 className="size-3.5" />,
      onClick: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: editor?.isActive('heading', { level: 3 }) ?? false,
      disabled: disabled || !editor?.can().toggleHeading({ level: 3 }),
    },
    {
      label: 'Bullet List',
      icon: <List className="size-3.5" />,
      onClick: () => editor?.chain().focus().toggleBulletList().run(),
      isActive: editor?.isActive('bulletList') ?? false,
      disabled: disabled || !editor?.can().toggleBulletList(),
    },
    {
      label: 'Ordered List',
      icon: <ListOrdered className="size-3.5" />,
      onClick: () => editor?.chain().focus().toggleOrderedList().run(),
      isActive: editor?.isActive('orderedList') ?? false,
      disabled: disabled || !editor?.can().toggleOrderedList(),
    },
  ];

  // Sync external value changes (e.g. form reset) without re-triggering onUpdate
  useEffect(() => {
    if (!editor) return;
    const current = editor.isEmpty ? '' : editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  }, [value, editor]);

  // Sync disabled state
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  return (
    <div
      aria-invalid={invalid}
      className={cn(
        'w-full overflow-hidden rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow]',
        'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
        'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap gap-0.5 border-b border-input px-1.5 py-1">
        {toolbarItems.map((item) => (
          <ToolbarButton
            key={item.label}
            onClick={item.onClick}
            isActive={item.isActive}
            disabled={item.disabled}
            title={item.label}
          >
            {item.icon}
          </ToolbarButton>
        ))}
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} />
    </div>
  );
}
