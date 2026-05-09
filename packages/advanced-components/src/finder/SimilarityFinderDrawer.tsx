"use client";

import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useFinderSlot, useGlobalSearch } from "@graviola/edb-state-hooks";
import type { EntityFinderProps } from "@graviola/semantic-jsonform-types";
import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Dialog,
  DialogContent,
  Drawer,
  IconButton,
  Toolbar,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useCallback, useEffect } from "react";
import type { JSONSchema7 } from "json-schema";

export type SimilarityFinderDrawerProps = Omit<EntityFinderProps, "search"> &
  Record<string, unknown>;

/**
 * NiceModal shell for the similarity / entity finder: persistent drawer on `md+`,
 * full-screen dialog on smaller breakpoints. Registers visibility with
 * {@link useGlobalSearch#similarityFinderOpen}.
 */
export const SimilarityFinderDrawer =
  NiceModal.create<SimilarityFinderDrawerProps>((props) => {
    const modal = useModal();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const Finder = useFinderSlot();
    const search = useGlobalSearch((s) => s.search);
    const setSearch = useGlobalSearch((s) => s.setSearch);
    const setSimilarityFinderOpen = useGlobalSearch(
      (s) => s.setSimilarityFinderOpen,
    );

    const onSearchChangeProp = props.onSearchChange;
    const handleSearchChange = useCallback(
      (value: string) => {
        setSearch(value);
        onSearchChangeProp?.(value);
      },
      [onSearchChangeProp, setSearch],
    );

    useEffect(() => {
      setSimilarityFinderOpen(modal.visible);
    }, [modal.visible, setSimilarityFinderOpen]);

    const handleExisting = (entityIRI: string, data: unknown) => {
      props.onExistingEntityAccepted?.(entityIRI, data as any);
      modal.hide();
    };

    const handleMapped = (data: unknown) => {
      props.onMappedDataAccepted?.(data as any);
      modal.hide();
    };

    const content = (
      <Finder
        finderId={props.finderId}
        search={search}
        data={props.data}
        classIRI={props.classIRI}
        jsonSchema={props.jsonSchema as JSONSchema7}
        onExistingEntityAccepted={handleExisting}
        onMappedDataAccepted={handleMapped}
        onEntityIRIChange={props.onEntityIRIChange}
        onSelectedEntityChange={props.onSelectedEntityChange}
        hideFooter={props.hideFooter}
        prepareNewEntityData={props.prepareNewEntityData}
        onSearchChange={handleSearchChange}
        additionalKnowledgeSources={props.additionalKnowledgeSources}
        knowledgeSources={props.knowledgeSources}
        allKnowledgeBases={props.allKnowledgeBases}
      />
    );

    const closeBtn = (
      <Toolbar
        variant="dense"
        sx={{ justifyContent: "flex-end", minHeight: 48 }}
      >
        <IconButton edge="end" onClick={() => modal.hide()} aria-label="close">
          <CloseIcon />
        </IconButton>
      </Toolbar>
    );

    if (isMobile) {
      return (
        <Dialog
          open={modal.visible}
          onClose={() => modal.hide()}
          fullWidth
          maxWidth="md"
          fullScreen
        >
          {closeBtn}
          <DialogContent sx={{ pt: 0 }}>{content}</DialogContent>
        </Dialog>
      );
    }

    return (
      <Drawer
        variant="persistent"
        anchor="right"
        open={modal.visible}
        sx={{
          flexShrink: 0,
          zIndex: (t) => t.zIndex.drawer,
          "& .MuiDrawer-paper": {
            width: 500,
            boxSizing: "border-box",
          },
        }}
      >
        {closeBtn}
        <Box sx={{ overflow: "auto", flex: 1, pb: 2 }}>{content}</Box>
      </Drawer>
    );
  });
