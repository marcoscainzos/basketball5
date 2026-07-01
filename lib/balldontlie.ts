import { BalldontlieAPI } from "@balldontlie/sdk";

export const api = new BalldontlieAPI({
  apiKey: process.env.BALLDONTLIE_API_KEY!,
});