import express from "express";
import cors from "cors";

import v1Router from "./api/v1";

export const app = express();

app.use(cors());

app.use(express.json({
  limit: "10mb"
}));

app.use(express.urlencoded({
  extended: true
}));

app.use("/api/v1", v1Router);