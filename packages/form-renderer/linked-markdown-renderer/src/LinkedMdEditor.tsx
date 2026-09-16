import { EntitySuggestPopover } from "@graviola/entity-embed";
import {
  type EntityRef,
  remarkEntityRefs,
  serializeEntityRef,
  splitFrontmatter,
} from "@graviola/entity-ref-core";
import { useOptionalFinderSlot } from "@graviola/edb-state-hooks";
import { Link as LinkIcon, TravelExplore } from "@mui/icons-material";
import { Box } from "@mui/material";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import rehypeExternalLinks from "rehype-external-links";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

import { EntityLinkFinderDrawer } from "./EntityLinkFinderDrawer";
import { insertMarkdownSnippet } from "./insertMarkdownSnippet";
import { createLinkedMdPreviewComponents } from "./linkedMdComponents";
import { parseEntityEmbedView } from "./LinkedMdPreviewContext";
import MDEditor from "./LazyMDEditor";

export type LinkedMdEditorProps = {
  value: string;
  onChange: (value: string) => void;
  height?: number;
  syntax?: "uri" | "wikilink";
  showPreview?: boolean;
  enableKnowledgeBaseSearch?: boolean;
  knowledgeBaseTypeNames?: string[];
};

export function LinkedMdEditor({
  value,
  onChange,
  height = 400,
  syntax = "uri",
  showPreview = true,
  enableKnowledgeBaseSearch = true,
  knowledgeBaseTypeNames,
}: LinkedMdEditorProps) {
  const [suggestQuery, setSuggestQuery] = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [finderOpen, setFinderOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const Finder = useOptionalFinderSlot();
  const kbSearchEnabled = enableKnowledgeBaseSearch && Finder != null;

  const { frontmatter } = splitFrontmatter(value);
  const defaultView =
    parseEntityEmbedView(frontmatter?.defaultView) ?? "inline";

  const previewComponents = useMemo(
    () => createLinkedMdPreviewComponents(defaultView),
    [defaultView],
  );

  const rehypePlugins = useMemo(() => {
    const schema = {
      ...defaultSchema,
      protocols: {
        ...defaultSchema.protocols,
        href: [...(defaultSchema.protocols?.href ?? []), "graviola"],
      },
    };
    return [
      [rehypeSanitize, schema],
      [rehypeExternalLinks, { target: "_blank" }],
    ];
  }, []);

  const insertSnippet = useCallback(
    (snippet: string, replaceWikiTrigger = false) => {
      insertMarkdownSnippet({
        value,
        onChange,
        textarea: textareaRef.current,
        snippet,
        replaceWikiTrigger,
      });
    },
    [onChange, value],
  );

  const handleChange = useCallback(
    (next?: string) => {
      const v = next ?? "";
      onChange(v);

      const textarea = textareaRef.current;
      if (!textarea) return;
      const cursor = textarea.selectionStart ?? v.length;
      const before = v.slice(0, cursor);
      const wikiTrigger = before.match(/\[\[([^\]]*)$/);
      if (wikiTrigger) {
        setSuggestQuery(wikiTrigger[1] ?? "");
        setSuggestOpen(true);
      } else {
        setSuggestOpen(false);
        setSuggestQuery("");
      }
    },
    [onChange],
  );

  const linkEntityCommand = useMemo(
    () => ({
      name: "linkEntity",
      keyCommand: "linkEntity",
      buttonProps: { "aria-label": "Link entity", title: "Link entity" },
      icon: <LinkIcon style={{ width: 14, height: 14 }} />,
      execute: () => {
        setSuggestQuery("");
        setSuggestOpen(true);
        textareaRef.current?.focus();
      },
    }),
    [],
  );

  const searchKnowledgeBaseCommand = useMemo(
    () => ({
      name: "searchKnowledgeBase",
      keyCommand: "searchKnowledgeBase",
      buttonProps: {
        "aria-label": "Search knowledge base",
        title: "Search knowledge base",
      },
      icon: <TravelExplore style={{ width: 14, height: 14 }} />,
      execute: () => {
        setFinderOpen(true);
        textareaRef.current?.focus();
      },
    }),
    [],
  );

  const handleSuggestSelect = useCallback(
    (_candidate: unknown, markdown: string) => {
      insertSnippet(markdown, true);
      setSuggestOpen(false);
      setSuggestQuery("");
    },
    [insertSnippet],
  );

  const handleFinderAccept = useCallback(
    (ref: EntityRef) => {
      const markdown = serializeEntityRef(ref, {
        syntax,
        defaultView: ref.view,
      });
      insertSnippet(markdown, true);
      setFinderOpen(false);
    },
    [insertSnippet, syntax],
  );

  const extraCommands = useMemo(() => {
    const commands = [linkEntityCommand];
    if (kbSearchEnabled) {
      commands.push(searchKnowledgeBaseCommand);
    }
    return commands;
  }, [kbSearchEnabled, linkEntityCommand, searchKnowledgeBaseCommand]);

  return (
    <Box ref={containerRef} sx={{ position: "relative" }}>
      <MDEditor
        value={value}
        onChange={handleChange}
        height={height}
        preview={showPreview ? "live" : "edit"}
        previewOptions={{
          remarkPlugins: [remarkEntityRefs],
          rehypePlugins: rehypePlugins as never,
          components: previewComponents,
        }}
        textareaProps={{
          ref: textareaRef,
          onChange: (e: ChangeEvent<HTMLTextAreaElement>) => {
            textareaRef.current = e.currentTarget;
          },
        }}
        extraCommands={extraCommands}
        commandsFilter={(cmd) =>
          cmd?.name && /(divider|code|image|checked)/.test(cmd.name)
            ? false
            : cmd
        }
      />
      <EntitySuggestPopover
        query={suggestQuery}
        open={suggestOpen}
        onSelect={handleSuggestSelect}
        syntax={syntax}
      />
      {kbSearchEnabled ? (
        <EntityLinkFinderDrawer
          open={finderOpen}
          onClose={() => setFinderOpen(false)}
          onAccept={handleFinderAccept}
          typeNames={knowledgeBaseTypeNames}
          defaultView="chip"
        />
      ) : null}
    </Box>
  );
}
