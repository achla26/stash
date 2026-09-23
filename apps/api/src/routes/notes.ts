import { Hono } from "hono";
import { NotesController } from "../controllers/notes.controller";

const notes = new Hono();

// Collection routes
notes.get("/", NotesController.getAll);
notes.get("/trash", NotesController.getTrashed);
notes.post("/", NotesController.create);

// Single resource routes
notes.get("/:id", NotesController.getById);
notes.patch("/:id", NotesController.update);
notes.delete("/:id", NotesController.softDelete);

// Actions
notes.patch("/:id/restore", NotesController.restore);
notes.patch("/:id/pin", NotesController.togglePin);
notes.delete("/:id/permanent", NotesController.permanentDelete);

export default notes;