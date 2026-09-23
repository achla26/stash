import { PagesController } from "@/controllers/pages.controller";
import { Hono } from "hono";


const pages = new Hono();

pages.get("/:pageId", PagesController.getPage);
pages.patch("/:pageId", PagesController.updatePage);
pages.delete("/:pageId", PagesController.deletePage);

export default pages;