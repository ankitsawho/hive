import { z } from "zod";
import {
    createTRPCRouter,
    publicProcedure,
    protectedProcedure,
} from "~/server/api/trpc";

export const searchRouter = createTRPCRouter({
    searchClub: protectedProcedure.input(z.object({ query: z.string() })).query(async ({ input: { query }, ctx }) => {
        const result = ctx.prisma.club.findMany({
            where: {
                name: {
                    startsWith: query
                }
            },
            select: {
                name: true,
                id: true,
                _count: true
            },
            take: 5
        })
        return result
    }),
});

