import { Router } from "express";
import { Item } from "../models/Item.js";

const router = Router();

router.get("/", async (_req, res) => {
  const items = await Item.find({}).sort({ createdAt: -1 });
  res.json(items);
});

router.post("/", async (req, res) => {
  const body = req.body;
  const item = await Item.create({
    name: body.name,
    description: body.description || "",
    variants: body.variants || [],
    basePrice: Number(body.basePrice || 0),
  });
  res.status(201).json(item);
});

router.put("/:id", async (req, res) => {
  const body = req.body;
  const { id } = req.params;

  const updated = await Item.findByIdAndUpdate(
    id,
    {
      name: body.name,
      description: body.description || "",
      variants: body.variants || [],
      basePrice: Number(body.basePrice || 0),
    },
    { returnDocument: "after", runValidators: true }
  );

  if (!updated) {
    return res.status(404).json({ message: "Item not found" });
  }

  return res.json(updated);
});

export default router;
