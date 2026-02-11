import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { requireAuth } from "../../middleware/auth.js";
import { userOwnsCanvas } from "../../services/authorizationService.js";
import {
  createQuickNote,
  deleteQuickNote,
  listQuickNotes,
  toggleQuickNoteImportant,
  updateQuickNote,
} from "../../services/quickNoteService.js";
import { requireUserId } from "../shared/auth.js";
import { sendForbidden, sendNotFound, sendSuccess } from "../shared/responses.js";
import { CanvasIdParams, parseRoute } from "../shared/validation.js";

const quickNotesRouter = Router({ mergeParams: true });

quickNotesRouter.use(requireAuth);

// GET /api/canvases/:canvasId/quick-notes
quickNotesRouter.get("/", async (req: Request<{ canvasId: string }>, res: Response) => {
  const auth = requireUserId(req as AuthenticatedRequest, res);
  if (!auth) return;
  const parsed = parseRoute(req, res, { params: CanvasIdParams });
  if (!parsed) return;
  if (!(await userOwnsCanvas(auth.userId, parsed.params.canvasId))) {
    sendForbidden(res);
    return;
  }
  const notes = await listQuickNotes(parsed.params.canvasId);
  sendSuccess(res, notes);
});

const CreateBody = z.object({ content: z.string().optional() });

// POST /api/canvases/:canvasId/quick-notes
quickNotesRouter.post("/", async (req: Request<{ canvasId: string }>, res: Response) => {
  const auth = requireUserId(req as AuthenticatedRequest, res);
  if (!auth) return;
  const parsed = parseRoute(req, res, { params: CanvasIdParams, body: CreateBody });
  if (!parsed) return;
  if (!(await userOwnsCanvas(auth.userId, parsed.params.canvasId))) {
    sendForbidden(res);
    return;
  }
  const note = await createQuickNote(parsed.params.canvasId, parsed.body.content ?? "");
  sendSuccess(res, note, 201);
});

const UpdateBody = z.object({ content: z.string() });
const IdParams = z.object({ canvasId: z.string().uuid(), id: z.string().uuid() });

// PUT /api/canvases/:canvasId/quick-notes/:id
quickNotesRouter.put(
  "/:id",
  async (req: Request<{ canvasId: string; id: string }>, res: Response) => {
    const auth = requireUserId(req as AuthenticatedRequest, res);
    if (!auth) return;
    const parsed = parseRoute(req, res, { params: IdParams, body: UpdateBody });
    if (!parsed) return;
    if (!(await userOwnsCanvas(auth.userId, parsed.params.canvasId))) {
      sendForbidden(res);
      return;
    }
    const note = await updateQuickNote(parsed.params.id, parsed.body.content);
    if (!note) {
      sendNotFound(res);
      return;
    }
    sendSuccess(res, note);
  },
);

const ToggleParams = z.object({ canvasId: z.string().uuid(), id: z.string().uuid() });

// PATCH /api/canvases/:canvasId/quick-notes/:id/toggle-important
quickNotesRouter.patch(
  "/:id/toggle-important",
  async (req: Request<{ canvasId: string; id: string }>, res: Response) => {
    const auth = requireUserId(req as AuthenticatedRequest, res);
    if (!auth) return;
    const parsed = parseRoute(req, res, { params: ToggleParams });
    if (!parsed) return;
    if (!(await userOwnsCanvas(auth.userId, parsed.params.canvasId))) {
      sendForbidden(res);
      return;
    }
    const note = await toggleQuickNoteImportant(parsed.params.id);
    if (!note) {
      sendNotFound(res);
      return;
    }
    sendSuccess(res, note);
  },
);

const DeleteParams = z.object({ canvasId: z.string().uuid(), id: z.string().uuid() });

// DELETE /api/canvases/:canvasId/quick-notes/:id
quickNotesRouter.delete(
  "/:id",
  async (req: Request<{ canvasId: string; id: string }>, res: Response) => {
    const auth = requireUserId(req as AuthenticatedRequest, res);
    if (!auth) return;
    const parsed = parseRoute(req, res, { params: DeleteParams });
    if (!parsed) return;
    if (!(await userOwnsCanvas(auth.userId, parsed.params.canvasId))) {
      sendForbidden(res);
      return;
    }
    const deleted = await deleteQuickNote(parsed.params.id);
    if (!deleted) {
      sendNotFound(res);
      return;
    }
    sendSuccess(res, { deleted: true });
  },
);

export { quickNotesRouter };
