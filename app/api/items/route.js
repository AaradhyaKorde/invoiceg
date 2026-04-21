import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Item } from "@/models/Item";

export async function GET() {
  await connectDB();
  const items = await Item.find({}).sort({ createdAt: -1 });
  return NextResponse.json(items);
}

export async function POST(request) {
  await connectDB();
  const body = await request.json();
  const item = await Item.create({
    name: body.name,
    description: body.description || "",
    variants: body.variants || [],
    basePrice: Number(body.basePrice || 0),
  });
  return NextResponse.json(item, { status: 201 });
}
