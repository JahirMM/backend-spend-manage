import { NextResponse } from "next/server";

export async function GET() {
  const items = [
    { id: 1, name: "Manzana" },
    { id: 2, name: "Banana" },
    { id: 3, name: "Naranja" },
    { id: 4, name: "Mango" },
    { id: 5, name: "Uva" },
  ];

  return NextResponse.json(items);
}
