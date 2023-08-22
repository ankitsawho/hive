import { z } from "zod";
import {
    createTRPCRouter,
    publicProcedure,
    protectedProcedure,
} from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
    getInfinitePostsOfUser: publicProcedure.input(z.object({ userId: z.string(), limit: z.number().optional(), cursor: z.object({ id: z.string(), createdAt: z.date() }).optional() }))
        .query(async ({ input: { userId, limit = 10, cursor }, ctx }) => {
            const posts = await ctx.prisma.post.findMany({
                where: {
                    authorId: userId
                },
                take: limit + 1,
                cursor: cursor ? { createdAt_id: cursor } : undefined,
                orderBy: [{ createdAt: 'desc' }, { 'id': 'desc' }],
                select: {
                    club: { select: { name: true } },
                    id: true,
                    title: true,
                    createdAt: true,
                    content: true,
                    _count: { select: { comments: true } },
                    votes: true,
                    author: {
                        select: { name: true, id: true, image: true }
                    }
                }
            })
            let nextCursor: typeof cursor | undefined
            if (posts.length > limit) {
                const nextItem = posts.pop()
                if (nextItem != null) {
                    nextCursor = { id: nextItem.id, createdAt: nextItem.createdAt }
                }
            }
            return {
                posts: posts.map(post => {
                    return {
                        id: post.id,
                        club: post.club,
                        title: post.title,
                        content: post.content,
                        createdAt: post.createdAt,
                        user: post.author,
                        votes: post.votes,
                        commentCount: post._count.comments
                    }
                }), nextCursor
            }
        }),

    getUserInfo: publicProcedure.input(z.object({ userId: z.string() }))
        .query(async ({ input: { userId }, ctx }) => {
            const user = await ctx.prisma.user.findFirst({
                where: { id: userId },
                select: {
                    id: true,
                    name: true,
                    image: true,
                    _count: { select: { subscriptions: true, Post: true, createdClubs: true } },
                }
            })
            return user
        }),

});

