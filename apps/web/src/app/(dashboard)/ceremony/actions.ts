"use server"
export async function saveCeremony(_weddingId: string, _data: Record<string, unknown>): Promise<{ success: boolean; error?: string }> { return { success: true } }
