import { Hono, type Context } from "hono";
import { NotesController } from "../controllers/notes.controller";
import { ApiResponse } from "../lib/api-response";
import { autoTagNote, organizeStash } from "../lib/auto-tag";

const notes = new Hono();

// Collection routes
notes.get("/", NotesController.getAll);
notes.get("/trash", NotesController.getTrashed);
notes.post("/", NotesController.create);

// Single resource routes
notes.post("/:id/auto-tag", async (c: Context) => {
  const uid = (c.get("user") as { id: string }).id;
  const result = await autoTagNote(uid, c.req.param("id") ?? "");
  return ApiResponse.success(c, result);
});

notes.post("/organize", async (c: Context) => {
  const uid = (c.get("user") as { id: string }).id;
  const result = await organizeStash(uid);
  return ApiResponse.success(c, result);
});

notes.post("/bulk/soft-delete", (c) => NotesController.bulkSoftDelete(c));
notes.post("/bulk/permanent-delete", (c) => NotesController.bulkPermanentDelete(c));

notes.get("/:id", NotesController.getById);
notes.patch("/:id", NotesController.update);
notes.delete("/:id", NotesController.softDelete);

// Actions
notes.patch("/:id/restore", NotesController.restore);
notes.patch("/:id/pin", NotesController.togglePin);
notes.delete("/:id/permanent", NotesController.permanentDelete);

export default notes;