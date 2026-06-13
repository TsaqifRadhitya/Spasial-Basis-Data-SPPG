import { NextRequest, NextResponse } from "next/server";
import { SppgRepository } from "@/lib/repositories/sppgRepository";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "");
  const lng = parseFloat(searchParams.get("lng") || "");

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json(
      { error: "Parameter lat dan lng harus berupa angka valid." },
      { status: 400 },
    );
  }

  try {
    const result = await SppgRepository.simulateNewSppg(lat, lng);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[simulate-sppg]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
