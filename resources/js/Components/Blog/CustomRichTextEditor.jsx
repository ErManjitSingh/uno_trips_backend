import { useEffect, useMemo, useRef, useState } from 'react'
import { usePage } from '@inertiajs/react'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Eye,
  EyeOff,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Italic,
  Link2,
  List,
  ListOrdered,
  Moon,
  Pilcrow,
  Quote,
  Redo2,
  Sun,
  Underline,
  Undo2,
} from 'lucide-react'

import { imageTooLargeMessage } from '../../lib/imageUploadLimits'

const btnBase =
  'rounded-xl border border-white/60 bg-white/85 px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md'

function stripHtml(html) {
  const temp = document.createElement('div')
  temp.innerHTML = html || ''
  return (temp.textContent || temp.innerText || '').trim()
}

export default function CustomRichTextEditor({
  value,
  onChange,
  onImageUpload,
  className = '',
}) {
  const editorRef = useRef(null)
  const savedRangeRef = useRef(null)
  const [localContent, setLocalContent] = useState(value || '')
  const [showPreview, setShowPreview] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [compactToolbar, setCompactToolbar] = useState(false)
  const { props: pageProps } = usePage()
  const maxImageKb = pageProps?.max_upload_image_kb ?? 500
  const [activeState, setActiveState] = useState({
    bold: false,
    italic: false,
    underline: false,
    ul: false,
    ol: false,
    left: false,
    center: false,
    right: false,
    blockquote: false,
  })

  const wordCount = useMemo(() => {
    const text = stripHtml(localContent)
    if (!text) return 0
    return text.split(/\s+/).filter(Boolean).length
  }, [localContent])

  useEffect(() => {
    // Rehydrate editor content both on content changes and when switching back from preview.
    if (!editorRef.current || showPreview) return
    if (editorRef.current.innerHTML !== (localContent || '')) {
      editorRef.current.innerHTML = localContent || ''
    }
  }, [localContent, showPreview])

  useEffect(() => {
    const next = value || ''
    if (next !== localContent) {
      setLocalContent(next)
    }
  }, [value])

  const emitChange = () => {
    if (!editorRef.current) return
    const html = editorRef.current.innerHTML
    setLocalContent(html)
    onChange(html)
  }

  const refreshActiveState = () => {
    if (!editorRef.current) return
    const left = document.queryCommandState('justifyLeft')
    const center = document.queryCommandState('justifyCenter')
    const right = document.queryCommandState('justifyRight')

    setActiveState({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      ul: document.queryCommandState('insertUnorderedList'),
      ol: document.queryCommandState('insertOrderedList'),
      left: left || (!center && !right),
      center,
      right,
      blockquote: document.queryCommandValue('formatBlock')?.toLowerCase?.() === 'blockquote',
    })
  }

  const saveSelection = () => {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    savedRangeRef.current = sel.getRangeAt(0)
  }

  const restoreSelection = () => {
    const sel = window.getSelection()
    if (!sel || !savedRangeRef.current) return
    sel.removeAllRanges()
    sel.addRange(savedRangeRef.current)
  }

  const focusEditor = () => {
    editorRef.current?.focus()
    restoreSelection()
  }

  const runCommand = (command, commandValue = null) => {
    focusEditor()
    document.execCommand(command, false, commandValue)
    refreshActiveState()
    emitChange()
  }

  const togglePreviewMode = () => {
    // Capture latest draft before unmounting contenteditable in preview mode.
    if (editorRef.current) {
      const html = editorRef.current.innerHTML
      setLocalContent(html)
      onChange(html)
    }
    emitChange()
    setShowPreview((prev) => !prev)
  }

  const insertHeading = (tag) => {
    runCommand('formatBlock', tag)
  }

  const onEditorInput = () => {
    saveSelection()
    refreshActiveState()
    emitChange()
  }

  const openLinkModal = () => {
    saveSelection()
    const selectedText = stripHtml(window.getSelection()?.toString() || '')
    setLinkText(selectedText)
    setLinkUrl('')
    setShowLinkModal(true)
  }

  const applyLink = () => {
    if (!linkUrl.trim()) return
    focusEditor()

    const cleanUrl = /^https?:\/\//i.test(linkUrl.trim()) ? linkUrl.trim() : `https://${linkUrl.trim()}`
    const selectedText = stripHtml(window.getSelection()?.toString() || '')
    const text = linkText.trim() || selectedText || cleanUrl
    document.execCommand('insertHTML', false, `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer">${text}</a>`)
    setShowLinkModal(false)
    refreshActiveState()
    emitChange()
  }

  const insertCodeBlock = () => {
    runCommand('insertHTML', '<pre><code>// write code here</code></pre><p></p>')
  }

  const onPickImage = async (file) => {
    if (!file || !onImageUpload) return
    const sizeMsg = imageTooLargeMessage(file, maxImageKb)
    if (sizeMsg) {
      window.alert(sizeMsg)
      return
    }
    setUploadingImage(true)
    try {
      const url = await onImageUpload(file)
      if (!url) return
      runCommand('insertImage', url)
    } catch (err) {
      window.alert(err?.message || 'Image upload failed.')
    } finally {
      setUploadingImage(false)
    }
  }

  useEffect(() => {
    const onKeyDown = (e) => {
      if (!editorRef.current) return
      const isEditorFocused = document.activeElement === editorRef.current
      if (!isEditorFocused) return

      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase()
        if (key === 'b') {
          e.preventDefault()
          runCommand('bold')
        } else if (key === 'i') {
          e.preventDefault()
          runCommand('italic')
        } else if (key === 'u') {
          e.preventDefault()
          runCommand('underline')
        } else if (key === 'k') {
          e.preventDefault()
          openLinkModal()
        } else if (key === 'z') {
          e.preventDefault()
          runCommand('undo')
        } else if (key === 'y') {
          e.preventDefault()
          runCommand('redo')
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  useEffect(() => {
    const onSelection = () => refreshActiveState()
    document.addEventListener('selectionchange', onSelection)
    return () => document.removeEventListener('selectionchange', onSelection)
  }, [])

  const actionBtn = (isActive = false, tone = 'violet') =>
    `${btnBase} ${
      tone === 'emerald'
        ? 'hover:border-emerald-200 hover:bg-emerald-50/90 hover:text-emerald-700'
        : tone === 'amber'
          ? 'hover:border-amber-200 hover:bg-amber-50/90 hover:text-amber-700'
          : tone === 'sky'
            ? 'hover:border-sky-200 hover:bg-sky-50/90 hover:text-sky-700'
            : 'hover:border-violet-200 hover:bg-violet-50/90 hover:text-violet-700'
    } ${
      isActive
        ? tone === 'emerald'
          ? 'border-emerald-300 bg-emerald-100/90 text-emerald-700 ring-1 ring-emerald-200'
          : tone === 'amber'
            ? 'border-amber-300 bg-amber-100/90 text-amber-700 ring-1 ring-amber-200'
            : tone === 'sky'
              ? 'border-sky-300 bg-sky-100/90 text-sky-700 ring-1 ring-sky-200'
              : 'border-violet-300 bg-violet-100/90 text-violet-700 ring-1 ring-violet-200'
        : ''
    }`

  const Icon = ({ children }) => <span className="inline-flex items-center justify-center">{children}</span>

  return (
    <div className={`overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_20px_65px_-30px_rgba(37,99,235,0.35)] ${className}`}>
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 bg-gradient-to-r from-fuchsia-50 via-violet-50 to-cyan-50 p-3 backdrop-blur">
        <span className="mr-1 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow">Toolbar</span>
        <button type="button" className={actionBtn(activeState.bold, 'violet')} onClick={() => runCommand('bold')} title="Bold">
          <Icon><Bold className="h-3.5 w-3.5" /></Icon>{compactToolbar ? '' : ' Bold'}
        </button>
        <button type="button" className={actionBtn(activeState.italic, 'violet')} onClick={() => runCommand('italic')} title="Italic">
          <Icon><Italic className="h-3.5 w-3.5" /></Icon>{compactToolbar ? '' : ' Italic'}
        </button>
        <button type="button" className={actionBtn(activeState.underline, 'violet')} onClick={() => runCommand('underline')} title="Underline">
          <Icon><Underline className="h-3.5 w-3.5" /></Icon>{compactToolbar ? '' : ' Underline'}
        </button>
        <button type="button" className={actionBtn(false, 'amber')} onClick={() => insertHeading('H1')} title="Heading 1">
          <Icon><Heading1 className="h-3.5 w-3.5" /></Icon>{compactToolbar ? '' : ' H1'}
        </button>
        <button type="button" className={actionBtn(false, 'amber')} onClick={() => insertHeading('H2')} title="Heading 2">
          <Icon><Heading2 className="h-3.5 w-3.5" /></Icon>{compactToolbar ? '' : ' H2'}
        </button>
        <button type="button" className={actionBtn(false, 'amber')} onClick={() => insertHeading('H3')} title="Heading 3">
          <Icon><Heading3 className="h-3.5 w-3.5" /></Icon>{compactToolbar ? '' : ' H3'}
        </button>
        <button type="button" className={actionBtn(false, 'amber')} onClick={() => insertHeading('P')} title="Paragraph">
          <Icon><Pilcrow className="h-3.5 w-3.5" /></Icon>{compactToolbar ? '' : ' P'}
        </button>
        <button type="button" className={actionBtn(activeState.ul, 'emerald')} onClick={() => runCommand('insertUnorderedList')} title="Bullet List">
          <Icon><List className="h-3.5 w-3.5" /></Icon>{compactToolbar ? '' : ' Bullet'}
        </button>
        <button type="button" className={actionBtn(activeState.ol, 'emerald')} onClick={() => runCommand('insertOrderedList')} title="Numbered List">
          <Icon><ListOrdered className="h-3.5 w-3.5" /></Icon>{compactToolbar ? '' : ' Number'}
        </button>
        <button type="button" className={actionBtn(activeState.left, 'sky')} onClick={() => runCommand('justifyLeft')} title="Align Left">
          <Icon><AlignLeft className="h-3.5 w-3.5" /></Icon>{compactToolbar ? '' : ' Left'}
        </button>
        <button type="button" className={actionBtn(activeState.center, 'sky')} onClick={() => runCommand('justifyCenter')} title="Align Center">
          <Icon><AlignCenter className="h-3.5 w-3.5" /></Icon>{compactToolbar ? '' : ' Center'}
        </button>
        <button type="button" className={actionBtn(activeState.right, 'sky')} onClick={() => runCommand('justifyRight')} title="Align Right">
          <Icon><AlignRight className="h-3.5 w-3.5" /></Icon>{compactToolbar ? '' : ' Right'}
        </button>
        <button type="button" className={actionBtn(false, 'violet')} onClick={openLinkModal} title="Insert Link">
          <Icon><Link2 className="h-3.5 w-3.5" /></Icon>{compactToolbar ? '' : ' Link'}
        </button>
        <label className={`${actionBtn(false, 'violet')} cursor-pointer`} title="Insert Image">
          <Icon><Image className="h-3.5 w-3.5" /></Icon>{compactToolbar ? '' : uploadingImage ? ' Uploading...' : ' Image'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploadingImage}
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) onPickImage(file)
            }}
          />
        </label>
        <button type="button" className={actionBtn(activeState.blockquote, 'amber')} onClick={() => runCommand('formatBlock', 'BLOCKQUOTE')} title="Blockquote">
          <Icon><Quote className="h-3.5 w-3.5" /></Icon>{compactToolbar ? '' : ' Quote'}
        </button>
        <button type="button" className={actionBtn(false, 'amber')} onClick={insertCodeBlock} title="Code Block">
          <Icon><Code2 className="h-3.5 w-3.5" /></Icon>{compactToolbar ? '' : ' Code'}
        </button>
        <button type="button" className={actionBtn(false, 'sky')} onClick={() => runCommand('undo')} title="Undo">
          <Icon><Undo2 className="h-3.5 w-3.5" /></Icon>{compactToolbar ? '' : ' Undo'}
        </button>
        <button type="button" className={actionBtn(false, 'sky')} onClick={() => runCommand('redo')} title="Redo">
          <Icon><Redo2 className="h-3.5 w-3.5" /></Icon>{compactToolbar ? '' : ' Redo'}
        </button>
        <button
          type="button"
          className={actionBtn(compactToolbar)}
          onClick={() => setCompactToolbar((prev) => !prev)}
          title="Compact Toolbar"
        >
          {compactToolbar ? 'Expanded' : 'Compact'}
        </button>
        <button
          type="button"
          className={actionBtn(darkMode)}
          onClick={() => setDarkMode((prev) => !prev)}
          title="Dark Mode"
        >
          <Icon>{darkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}</Icon>
          {compactToolbar ? '' : darkMode ? ' Light' : ' Dark'}
        </button>
        <div className="ml-auto flex items-center gap-2 rounded-2xl border border-white/80 bg-gradient-to-r from-indigo-100/80 via-fuchsia-100/80 to-cyan-100/80 px-2 py-1 shadow-sm">
          <button
            type="button"
            className={`${btnBase} ${showPreview ? 'border-indigo-300 bg-indigo-100/90 text-indigo-700 ring-1 ring-indigo-200' : 'hover:border-indigo-200 hover:bg-indigo-50/90 hover:text-indigo-700'}`}
            onClick={togglePreviewMode}
          >
            <Icon>{showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</Icon>{compactToolbar ? '' : showPreview ? ' Edit Mode' : ' Preview'}
          </button>
          <span className="rounded-xl border border-fuchsia-200/80 bg-white px-2.5 py-1 text-xs font-semibold text-fuchsia-700 shadow-sm">
            {wordCount} words
          </span>
        </div>
      </div>

      {showPreview ? (
        <div
          className="prose prose-slate prose-headings:text-slate-900 prose-a:text-indigo-700 prose-blockquote:border-indigo-200 prose-blockquote:text-slate-700 max-w-none bg-gradient-to-b from-white to-slate-50/40 p-6"
          dangerouslySetInnerHTML={{ __html: localContent || '<p>Nothing to preview.</p>' }}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={onEditorInput}
          onBlur={emitChange}
          onKeyUp={saveSelection}
          onMouseUp={saveSelection}
          className={`min-h-[520px] p-6 text-[15px] leading-7 outline-none ${
            darkMode
              ? 'bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 text-slate-100'
              : 'bg-gradient-to-b from-white via-violet-50/30 to-cyan-50/30 text-slate-800'
          }`}
          style={{ whiteSpace: 'pre-wrap' }}
        />
      )}

      {showLinkModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/60 bg-white/95 p-4 shadow-2xl">
            <h4 className="text-sm font-semibold text-slate-900">Insert Link</h4>
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
            <input
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              placeholder="Anchor text (optional)"
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className={btnBase} onClick={() => setShowLinkModal(false)}>Cancel</button>
              <button type="button" className="rounded-xl bg-gradient-to-r from-indigo-600 to-blue-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25" onClick={applyLink}>
                Apply
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
