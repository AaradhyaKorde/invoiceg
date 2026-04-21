import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Item } from "@/models/Item";

export async function PUT(request, { params }) {
  await connectDB();
  const body = await request.json();
  const { id } = await params;

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
    return NextResponse.json({ message: "Item not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
