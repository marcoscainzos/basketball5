import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.BALLDONTLIE_API_KEY;

  const response = await fetch(
    "https://api.balldontlie.io/v1/players?search=lebron",
    {
      headers: {
        Authorization: apiKey!,
      },
    }
  );

  const data = await response.json();

  return NextResponse.json(data);
}