import { Hono } from "hono";
import { DashboardController } from "../controllers/dashboard.controller";

const dashboard = new Hono();

dashboard.get("/", DashboardController.getDashboard);
dashboard.get("/stats", DashboardController.getStats);
dashboard.get("/recent", DashboardController.getRecent);

export default dashboard;